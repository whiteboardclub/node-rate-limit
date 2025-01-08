import { StorageType } from "../constants/storage-type";

abstract class BaseStorage {
  protected name: StorageType;
  constructor(name: StorageType) {
    this.name = name;
  }

  abstract set(_data: any): Promise<void>;

  abstract get(_key: string): Promise<any>;
}

export default BaseStorage;
