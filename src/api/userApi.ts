import { axiosClient, unwrapResponse } from "./axiosClient";
import type { UserAccount, BanUserDto, RoleUpdateType, UpdateUserRoleDto, GetAllUsersQueryDto } from "@/types";

export class UserApi {
  private readonly _endpoint: string;

  constructor() {
    this._endpoint = '/user';
  }

  async getAllUsers(query?: GetAllUsersQueryDto): Promise<UserAccount[]> {
    const res = await axiosClient.get(this._endpoint, { params: query });
    return unwrapResponse(res.data);
  }

  async banUser(dto: BanUserDto): Promise<UserAccount> {
    const res = await axiosClient.patch(this._endpoint, dto);
    return unwrapResponse(res.data);
  }

  async updateUserRole(userId: string, type: RoleUpdateType): Promise<UserAccount> {
    const body: UpdateUserRoleDto = { userId };
    const res = await axiosClient.patch(`${this._endpoint}/role/update`, body, {
      params: { type },
    });
    return unwrapResponse(res.data);
  }
}

const userApi = new UserApi();
export default userApi;
