import { api } from "./client";
import type { IdentityKeyBundle } from "../../crypto/types";

interface DevicePayload extends IdentityKeyBundle {
  deviceName: string;
  deviceType: "mobile" | "tablet" | "desktop";
  platform: "android" | "ios";
}

type LoginDeviceParams = { deviceId: string; device?: never } | { deviceId?: never; device: DevicePayload };

export const authApi = {
  register: (params: { username: string; displayName: string; password: string; device: DevicePayload }) =>
    api.post("/auth/register", params).then((r) => r.data),

  login: (params: { username: string; password: string } & LoginDeviceParams) =>
    api.post("/auth/login", params).then((r) => r.data),

  logout: (refreshToken: string) => api.post("/auth/logout", { refreshToken }),
};
