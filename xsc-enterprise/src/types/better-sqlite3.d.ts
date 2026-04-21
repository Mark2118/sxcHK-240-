declare module 'better-sqlite3' {
  interface Database {
    exec(sql: string): void
    prepare(sql: string): Statement
    pragma(source: string, options?: { simple?: boolean }): any
    close(): void
  }

  interface Statement {
    run(...params: any[]): { changes: number; lastInsertRowid: number | bigint }
    get(...params: any[]): any
    all(...params: any[]): any[]
  }

  class Database {
    constructor(filename: string, options?: { readonly?: boolean; fileMustExist?: boolean; timeout?: number; verbose?: Function })
  }

  export = Database
}
