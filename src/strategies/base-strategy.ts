import BaseStorage from "../storages/base-storage";
import BaseResponse from "../interfaces/base-response";

abstract class BaseStrategy {
  protected store: BaseStorage;
  constructor(store: BaseStorage) {
    this.store = store;
  }

  abstract check(_key: string): Promise<BaseResponse>;
}
export default BaseStrategy;
