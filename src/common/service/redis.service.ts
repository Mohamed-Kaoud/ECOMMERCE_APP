import type { RedisClientType } from "redis";
import { EmailEnum } from "../enum/email.enum";
import { Types } from "mongoose";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
class RedisService {

  constructor(@Inject("REDIS_CLIENT") private readonly client: RedisClientType) {}

  async connect() {
    await this.client.connect();
    console.log(`Redis connected successfully ✅`);
  }

  handleEvents() {
    this.client.on("error", (error) => {
      console.log(`Fail to connect Redis ❌`, error);
    });
  }

  otp_key = ({
    email,
    subject = EmailEnum.confirmEmail,
  }: {
    email: string;
    subject?: EmailEnum;
  }) => {
    return `otp::${email}::${subject}`;
  };

  block_otp_key = (email: string) => {
    return `${this.otp_key({ email })}::blocked`;
  };

  max_otp_key = (email: string) => {
    return `${this.otp_key({ email })}::max_tries`;
  };

  revoked_key = ({ userId, jti }: { userId: Types.ObjectId; jti: string }) => {
    return `revoke_token::${userId}::${jti}`;
  };

  get_key = (userId: Types.ObjectId) => {
    return `revoke_token::${userId}`;
  };

  setValue = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string | object;
    ttl?: number;
  }) => {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);
      return ttl
        ? await this.client.set(key, data, { EX: ttl })
        : await this.client.set(key, data);
    } catch (error) {
      console.log(`Fail to set value in redis ❌`, error);
    }
  };

  get = async (key: string) => {
    try {
      const data = await this.client.get(key);
      if (!data) {
        return null;
      }
      try {
        return JSON.parse(data);
      } catch (error) {
        return data;
      }
    } catch (error) {
      console.log(`Fail to get data from redis`, error);
    }
  };

  update = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string | object;
    ttl?: number;
  }) => {
    try {
      if (!(await this.client.exists(key))) {
        return 0;
      }
      return ttl !== undefined
        ? await this.setValue({ key, value, ttl })
        : await this.setValue({ key, value });
    } catch (error) {
      console.log(`Fail to update data in redis`, error);
    }
  };

  deleteKey = async (key: string | string[]) => {
    try {
      if (!key.length) {
        return 0;
      }
      return await this.client.del(key);
    } catch (error) {
      console.log(`Fail to delete key from redis`, error);
    }
  };

  exists = async (key: string) => {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.log(`Fail to check existance of ${key} in redis ❌`, error);
    }
  };

  ttl = async (key: string) => {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.log(`Fail to check ttl of ${key} in redis`, error);
    }
  };

  expire = async ({ key, ttl }: { key: string; ttl: number }) => {
    try {
      return await this.client.expire(key, ttl);
    } catch (error) {
      console.log(`Fail to add expiration to ${key} in redis`, error);
    }
  };

  keys = async (pattern: string) => {
    try {
      return await this.client.keys(`${pattern}*`);
    } catch (error) {
      console.log(`Fail to get all keys for the pattern: ${pattern}`, error);
    }
  };

  incr = async (key: string) => {
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.log(`Fail to incr this key`, error);
    }
  };

  key(userId: Types.ObjectId) {
    return `user:FCM:${userId}`;
  }

  async addFCM({
    userId,
    FCMToken,
  }: {
    userId: Types.ObjectId;
    FCMToken: string;
  }) {
    return await this.client.sAdd(this.key(userId), FCMToken);
  }

  async removeFCM({
    userId,
    FCMToken,
  }: {
    userId: Types.ObjectId;
    FCMToken: string;
  }) {
    return await this.client.sRem(this.key(userId), FCMToken);
  }

  async getFCMs(userId: Types.ObjectId) {
    return await this.client.sMembers(this.key(userId));
  }

  async hasFCMs(userId: Types.ObjectId) {
    return await this.client.sCard(this.key(userId));
  }

  async removeFCMUser(userId: Types.ObjectId) {
    return await this.client.del(this.key(userId));
  }

  // ========================================

  socketKey(userId: Types.ObjectId) {
    return `User:Socket:${userId}`;
  }

  async addSocket({
    userId,
    SocketId,
  }: {
    userId: Types.ObjectId;
    SocketId: string;
  }) {
    return await this.client.sAdd(this.socketKey(userId), SocketId);
  }

  async removeSocket({
    userId,
    SocketId,
  }: {
    userId: Types.ObjectId;
    SocketId: string;
  }) {
    return await this.client.sRem(this.socketKey(userId), SocketId);
  }

  async getSockets(userId: Types.ObjectId) {
    return await this.client.sMembers(this.socketKey(userId));
  }

  async hasSockets(userId: Types.ObjectId) {
    return await this.client.sCard(this.socketKey(userId));
  }

  async removeSocketUser(userId: Types.ObjectId) {
    return await this.client.del(this.socketKey(userId));
  }
}

export default RedisService;
