export default abstract class AdminBaseApi {
  protected readonly _endpoint: string;
  constructor(endpoint: string) {
    this._endpoint = `/admin/${endpoint}`;
  }
}
