import type { ReplStore } from '@vue/repl'
import { VTG_PKG } from '@/constants'
import { cdnFileUrl, type CdnSource } from './cdn'

type LanguageResourceLinks = Pick<
  NonNullable<ReplStore['resourceLinks']>,
  'typescriptLib' | 'pkgFileTextUrl' | 'pkgDirUrl' | 'pkgLatestVersionUrl'
>

/**
 * REPL 用 String(fn) 把函数发送到 worker，再用 Function 重建；不能引用闭包。
 * 这里只把内部 CDN 配置序列化为字面量，包名、版本和路径仍是函数参数。
 */
function workerUrl<T>(parameters: string[], body: string): T {
  return new Function(...parameters, body) as T
}

export function createLanguageResourceLinks(source: CdnSource): LanguageResourceLinks {
  const remoteSource = source === 'local' ? 'jsdelivr' : source
  const template = cdnFileUrl(remoteSource, '__PKG__', '__VERSION__', '__PATH__')
  const fileExpression = `${JSON.stringify(template)}
    .replace('__PKG__', pkgName)
    .replace('__VERSION__', pkgVersion || 'latest')
    .replace('__PATH__', pkgPath.replace(/^\\/+/, ''))`
  const localBase = source === 'local' ? cdnFileUrl('local', VTG_PKG, '', '') : null
  const localFile = localBase
    ? `if (pkgName === ${JSON.stringify(VTG_PKG)}) return ${JSON.stringify(localBase)} + pkgPath.replace(/^\\/+/, '');`
    : ''

  return {
    typescriptLib: workerUrl(
      ['version'],
      `
      const pkgName = 'typescript', pkgVersion = version, pkgPath = 'lib/typescript.js';
      return ${fileExpression};
    `,
    ),
    pkgFileTextUrl: workerUrl(
      ['pkgName', 'pkgVersion', 'pkgPath'],
      `
      ${localFile}
      return ${fileExpression};
    `,
    ),
    // REPL 要求 unpkg 的 files[].path 元数据格式。公共目录保留 unpkg，
    // 实际声明文件与编译器跟随 CDN；本地包的目录与声明都由 Vite 提供。
    pkgDirUrl: workerUrl(
      ['pkgName', 'pkgVersion', 'pkgPath'],
      `
      ${localBase ? `if (pkgName === ${JSON.stringify(VTG_PKG)}) return ${JSON.stringify(localBase)} + pkgPath.replace(/^\\/+|\\/+$/g, '') + '?meta';` : ''}
      return 'https://unpkg.com/' + pkgName + '@' + pkgVersion + '/' + pkgPath.replace(/^\\/+|\\/+$/g, '') + '/?meta';
    `,
    ),
    pkgLatestVersionUrl: workerUrl(
      ['pkgName'],
      `
      const pkgVersion = 'latest', pkgPath = 'package.json';
      ${localFile}
      return ${fileExpression};
    `,
    ),
  }
}
