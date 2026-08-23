import { axiosClient, unwrapResponse } from "./axiosClient";
import type { UserAccount, BanUserDto } from "@/types";

export class UserApi {
  private readonly _endpoint: string;

  constructor() {
    this._endpoint = '/user';
  }

  async getAllUsers(): Promise<UserAccount[]> {
    const res = await axiosClient.get(this._endpoint);
    return unwrapResponse(res.data);
  }

  async banUser(dto: BanUserDto): Promise<UserAccount> {
    const res = await axiosClient.patch(this._endpoint, dto);
    return unwrapResponse(res.data);
  }
}

const userApi = new UserApi();
export default userApi;
