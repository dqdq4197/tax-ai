import ky from "ky";

export const client = ky.create({ prefix: "/api", retry: 0, timeout: false });
