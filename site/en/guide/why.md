---
title: Why vtable-guild - a table replacement for ant-design-vue / element-plus
description: vtable-guild is a table component for ant-design-vue and element-plus users. It keeps your existing column definitions and slot usage while filling in large-data rendering, column layout control and theme extensibility.
---

# Why vtable-guild

vtable-guild is not a brand-new UI system. It gives projects already using ant-design-vue or element-plus a smoother path to replacing their table.

The goal is clear: keep the column definitions, sorting, filtering and application integration you are used to, and fill in what the stock table lacks in large data volumes, column layout control and theme extensibility.

## Who it is for

This library suits these scenarios:

- Your project already uses ant-design-vue or element-plus and you want the table's visuals consistent with the rest of your UI system
- You do not want to keep maintaining extra wrappers for virtual scrolling, column resizing, striped rows and hover states
- You need a theming mechanism that controls styles globally, across an application line and on a single instance at the same time
- You want migration cost to stay manageable rather than rewriting every existing table page

## The core problems it solves

### 1. The stock table is not enough

Once application tables grow complex, the pain is usually not "can it render a table" but:

- scrolling and rendering feel poor with large data volumes
- users need to adjust column widths on the spot, but the stock table and your wrapper need yet another convention between them
- striped rows, hover rows, borders and empty states are mostly handled by extra CSS overrides
- the same application code has to plug into different visual systems, making style adjustments expensive

### 2. Continuing to stack patches on the stock table keeps getting heavier

In existing applications, the most expensive part is usually not the template syntax itself but the column configuration, data processing, event wiring and page conventions. The value of vtable-guild is keeping those usage patterns as they are and building the enhancements into the table itself, instead of pushing more complexity onto the application layer.

## When to consider it first

- You come from ant-design-vue and want to fill in virtual scrolling and a theming system without changing the table mental model
- You come from element-plus and want a unified columns + props model to replace scattered table capabilities
- You already write the same CSS hacks, scroll patches or theme wrappers over and over for similar tables

## When it is not a good fit

If your page is just a very simple data display table with no performance, column layout, theme switching or complex interaction needs, staying with the table that ships with your UI library is usually easier.

vtable-guild suits medium-to-large application tables, not replacement for its own sake.
