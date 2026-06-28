import multer from "multer";
import { multer_enum, Store_Enum } from "../enum/multer.enum";
import { tmpdir } from "node:os";
import type { Request } from "express";
import { BadRequestException } from "@nestjs/common";


export const multerCloud = ({
  store_type = Store_Enum.memory,
  custom_types = multer_enum.image,
}: {
  store_type?: Store_Enum;
  custom_types?: string[];
} = {}) => {
  const storage =
    store_type === Store_Enum.memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: tmpdir(),
          filename: function (
            req: Request,
            file: Express.Multer.File,
            cb: Function,
          ) {
            const uniqueSuffix =
              Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + "__" + file.originalname);
          },
        });

  function fileFilter(req: Request, file: Express.Multer.File, cb: Function) {
    if (!custom_types.includes(file.mimetype)) {
      cb(new BadRequestException("Invalid file type ❎"));
    } else {
      cb(null, true);
    }
  }

  

  return {storage,fileFilter}
};
