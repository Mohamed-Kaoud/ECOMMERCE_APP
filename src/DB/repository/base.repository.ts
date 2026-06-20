import {
  HydratedDocument,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  Types,
  UpdateQuery,
} from "mongoose";

class BaseRepository<Tdocument> {
  constructor(protected readonly model: Model<Tdocument>) {}

  async create(data: Partial<Tdocument>): Promise<HydratedDocument<Tdocument>> {
    return this.model.create(data);
  }

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<Tdocument>;
    projection?: ProjectionType<Tdocument>;
    options?: QueryOptions<Tdocument>;
  }): Promise<HydratedDocument<Tdocument> | null> {
    return this.model
      .findOne(filter)
      .populate(options?.populate as PopulateOptions | PopulateOptions[])
      .exec();
  }

  async findById(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<Tdocument> | null> {
    return this.model.findById(id);
  }

  async find({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<Tdocument>;
    projection?: ProjectionType<Tdocument>;
    options?: QueryOptions<Tdocument>;
  } = {}): Promise<HydratedDocument<Tdocument>[] | []> {
    return this.model
      .find(filter, projection)
      .skip(options?.skip!)
      .limit(options?.limit!)
      .sort(options?.sort)
      .populate(options?.populate as PopulateOptions);
  }
  findByIdAndUpdate({
    id,
    update,
    options,
  }: {
    id: Types.ObjectId;
    update: UpdateQuery<Tdocument>;
    options?: QueryOptions<Tdocument>;
  }): Promise<HydratedDocument<Tdocument> | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true, ...options });
  }

  findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<Tdocument>;
    update: UpdateQuery<Tdocument>;
    options?: QueryOptions<Tdocument>;
  }): Promise<HydratedDocument<Tdocument> | null> {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      ...options,
    });
  }

  findOneAndDelete({
    filter,
    options,
  }: {
    filter: QueryFilter<Tdocument>;
    options?: QueryOptions<Tdocument>;
  }): Promise<HydratedDocument<Tdocument> | null> {
    return this.model.findOneAndDelete(filter, options);
  }

  async paginate<T>({
    page,
    limit,
    sort,
    populate,
    search,
  }: {
    page?: number;
    limit?: number;
    sort?: any;
    populate?: any;
    search?: QueryFilter<T>;
  }) {
    page = +page! || 1;
    limit = +limit! || 1;
    if (page < 1) page = 1;
    if (limit < 1) limit = 2;

    const skip = (page - 1) * limit;

    const [data, totalDoc] = await Promise.all([
      await this.model
        .find({ ...(search ?? {}) })
        .limit(limit)
        .skip(skip)
        .sort(sort)
        .populate(populate)
        .exec(),
      await this.model.countDocuments({ ...(search ?? {}) }),
    ]);

    const totalPages = Math.ceil(totalDoc / limit);

    return {
      meta: {
        currentPage: page,
        totalPages,
        limit,
        totalDoc,
      },
      data,
    };
  }

  async deleteOne({ filter }: { filter: QueryFilter<Tdocument> }) {
    return this.model.deleteOne(filter);
  }
}

export default BaseRepository;
