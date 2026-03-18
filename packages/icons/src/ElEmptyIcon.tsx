import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ElEmptyIcon',
  inheritAttrs: true,
  setup(_, { attrs }) {
    return () => (
      <svg
        viewBox="0 0 79 86"
        width="64"
        height="70"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        {...attrs}
      >
        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <ellipse fill="currentColor" opacity=".15" cx="39.5" cy="82.5" rx="39.5" ry="3.5" />
          <polygon
            fill="currentColor"
            opacity=".4"
            transform="translate(27.500000, 51.500000) scale(1, -1) translate(-27.500000, -51.500000)"
            points="13 58 53 58 42 45 2 45"
          />
          <g transform="translate(34.500000, 31.500000) scale(-1, 1) rotate(-25.000000) translate(-34.500000, -31.500000) translate(7.000000, 10.000000)">
            <polygon
              fill="currentColor"
              opacity=".4"
              transform="translate(11.500000, 5.000000) scale(1, -1) translate(-11.500000, -5.000000)"
              points="2.84078316e-14 3 18 3 23 7 5 7"
            />
            <polygon
              fill="currentColor"
              opacity=".25"
              points="-3.69149156e-15 7 38 7 38 43 -3.69149156e-15 43"
            />
            <rect
              fill="currentColor"
              opacity=".3"
              transform="translate(46.500000, 25.000000) scale(-1, 1) translate(-46.500000, -25.000000)"
              x="38"
              y="7"
              width="17"
              height="36"
            />
            <polygon
              fill="currentColor"
              opacity=".2"
              transform="translate(39.500000, 3.500000) scale(-1, 1) translate(-39.500000, -3.500000)"
              points="24 7 41 7 55 0 38 0"
            />
          </g>
          <rect fill="currentColor" opacity=".2" x="13" y="45" width="40" height="36" />
          <g transform="translate(53.000000, 45.000000)">
            <rect
              fill="currentColor"
              opacity=".35"
              transform="translate(8.500000, 18.000000) scale(-1, 1) translate(-8.500000, -18.000000)"
              x="0"
              y="0"
              width="17"
              height="36"
            />
            <polygon
              fill="currentColor"
              opacity=".2"
              transform="translate(12.000000, 9.000000) scale(-1, 1) translate(-12.000000, -9.000000)"
              points="7 0 24 0 20 18 7 16.5"
            />
          </g>
          <polygon
            fill="currentColor"
            opacity=".2"
            transform="translate(66.000000, 51.500000) scale(-1, 1) translate(-66.000000, -51.500000)"
            points="62 45 79 45 70 58 53 58"
          />
        </g>
      </svg>
    )
  },
})
