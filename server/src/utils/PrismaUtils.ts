class PrismaUtils {
  static async findFirst(model: any, where: object) {
    try {
      return await model.findFirst({ where });
    } catch (error) {
      throw new Error("Failed to fetch record");
    }
  }

  static async findMany(model: any, where: object, orderBy?: object) {
    try {
      return await model.findMany({
        where,
        orderBy,
      });
    } catch (error) {
      throw new Error("Failed to fetch records");
    }
  }

  static async findOne(model: any, where: object) {
    try {
      return await model.findUnique({ where });
    } catch (error) {
      throw new Error("Failed to fetch record");
    }
  }

  static async create(model: any, data: object) {
    try {
      return await model.create({
        data,
      });
    } catch (error) {
      throw new Error("Failed to create record");
    }
  }

  static async update(model: any, where: object, data: object) {
    try {
      return await model.update({
        where,
        data,
      });
    } catch (error) {
      throw new Error("Failed to update record");
    }
  }

  static async delete(model: any, where: object) {
    try {
      return await model.delete({
        where,
      });
    } catch (error) {
      throw new Error("Failed to delete record");
    }
  }

  static async deleteMany(model: any, where: object) {
    try {
      return await model.deleteMany({
        where,
      });
    } catch (error) {
      throw new Error("Failed to delete records");
    }
  }
}

export default PrismaUtils;
