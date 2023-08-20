class FunctionQueue {
  private queue: Array<(...args: any[]) => Promise<any>>;

  constructor() {
    this.queue = [];
  }

  /**
 * @description: 判断函数是否为异步函数
 * @param {function} func
 * @return {*}
 */
  private isAsyncFunction(func: (...args: any[]) => any): boolean {
    return func.constructor.name === 'AsyncFunction';
  }

  /**
   * @description: 添加函数到队列
   * @param {function} func
   * @param {array} args
   * @return {*}
   */
  enqueue(func: (...args: any[]) => any, ...args: any[]): void {
    const asyncFunc = async () => {
      await func(...args);
    };

    // 如果是异步函数直接添加到队列，如果不是异步函数，则包装成异步函数再进行添加
    if (!this.isAsyncFunction(func)) {
      this.queue.push(asyncFunc);
    } else {
      this.queue.push(func as (...args: any[]) => Promise<any>);
    }
  }

  /**
   * @description: 执行队列中的函数
   * @return {*}
   */
  async execute(): Promise<void> {
    if (!this.queue?.length) {
      console.log('队列中没有函数');
      return
    }
    for (const func of this.queue) {
      await func();
    }
  }

  /**
   * @description: 清空队列
   * @return {*}
   */
  clear(): void {
    this.queue = [];
  }
}

export default FunctionQueue


/**
 * 使用方法
 * 
  const queue = new FunctionQueue();

  function greet(name: string): void {
    console.log(`Hello, ${name}`);
  }

  queue.enqueue(greet, "Alice");
  queue.enqueue((age: number) => {
    console.log(`I am ${age} years old.`);
  }, 25);

  queue.execute().then(() => {
    console.log('所有函数执行完毕');
  });
 */