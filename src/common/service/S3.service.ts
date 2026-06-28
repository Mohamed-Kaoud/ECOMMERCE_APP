import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
// import {
//   AWS_ACCESS_KEY,
//   AWS_BUCKET_NAME,
//   AWS_REGION,
//   AWS_SECRET_ACCESS_KEY,
// } from "../../config/config.service";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Store_Enum } from "../enum/multer.enum";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class S3Service {
  private client: S3Client;
  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async uploadFile({
    ACL = ObjectCannedACL.private,
    path = "General",
    file,
    store_type = Store_Enum.memory,
  }: {
    ACL?: ObjectCannedACL;
    path?: string;
    file: Express.Multer.File;
    store_type?: Store_Enum;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      ACL,
      Key: `Social_App/${path}/${randomUUID()}__${file.originalname}`,
      Body:
        store_type === Store_Enum.memory
          ? file.buffer
          : fs.createReadStream(file.path),
      ContentType: file.mimetype,
    });

    if (!command.input.Key) {
      throw new BadRequestException("Fail to upload file on AWS 🔴");
    }

    await this.client.send(command);

    return command.input.Key;
  }

  async uploadLargeFile({
    ACL = ObjectCannedACL.private,
    path = "General",
    file,
    store_type = Store_Enum.disk,
  }: {
    ACL?: ObjectCannedACL;
    path?: string;
    file: Express.Multer.File;
    store_type?: Store_Enum;
  }) {
    const command = new Upload({
      client: this.client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        ACL,
        Key: `Social_App/${path}/${randomUUID()}__${file.originalname}`,
        Body:
          store_type === Store_Enum.memory
            ? file.buffer
            : fs.createReadStream(file.path),
        ContentType: file.mimetype,
      },
    });

    const result = await command.done();

    command.on("httpUploadProgress", (progress) => {
      console.log(progress);
    });

    return result.Key;
  }

  async uploadFiles({
    ACL = ObjectCannedACL.private,
    path = "General",
    files,
    store_type = Store_Enum.memory,
    isLarge = false,
  }: {
    ACL?: ObjectCannedACL;
    path?: string;
    files: Express.Multer.File[];
    store_type?: Store_Enum;
    isLarge?: boolean;
  }) {
    let urls: any = [];

    if (isLarge) {
      urls = await Promise.all(
        files.map((file) => {
          return this.uploadLargeFile({ ACL, path, file, store_type });
        }),
      );
    } else {
      urls = await Promise.all(
        files.map((file) => {
          return this.uploadFile({ ACL, path, file, store_type });
        }),
      );
    }

    return urls;
  }

  async createPreSignedUrl({
    path,
    fileName,
    ContentType,
    expiresIn = 60,
  }: {
    path: string;
    fileName: string;
    ContentType: string;
    expiresIn?: number;
  }) {
    const Key = `Social_App/${path}/${randomUUID()}__${fileName}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key,
      ContentType,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });

    return { url, Key };
  }

  async getFile(Key: string) {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key,
    });

    return await this.client.send(command);
  }

  async getPreSignedUrl({
    Key,
    expiresIn = 60,
    download 
  }: {
    Key: string;
    expiresIn?: number;
    download?: string | undefined
  }) {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key,
      ResponseContentDisposition: download ? `attachment; filename="${Key.split("/").pop()}"` : undefined
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });

    return url;
  }

  async getFiles(folderName: string) {

    const command = new ListObjectsV2Command({
        Bucket: process.env.AWS_BUCKET_NAME,
        Prefix: `social_media_app/${folderName}`
    })

    return await this.client.send(command)
}


  async deleteFile(Key: string) {

    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key
    })

    return await this.client.send(command)
}

  async deleteFiles(Keys: string[]) {
    const keyMapped = Keys.map((k) => {
      return {Key: k}
    })
    const command = new DeleteObjectsCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: {
          Objects: keyMapped,
          Quiet: false
        }
    })

    return await this.client.send(command)
}

async deleteFolder(folderName: string) {

    const data = await this.getFiles(folderName)

    const keyMapped = data?.Contents?.map((k) => {
        return k.Key
    })

    return await this.deleteFiles(keyMapped as string[])

}

}

export default S3Service;
