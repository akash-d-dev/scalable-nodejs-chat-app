class PrismaUtils {
  // General function to fetch the first record based on a filter
  static async findFirst(model: any, where: object) {
    try {
      return await model.findFirst({ where });
    } catch (error) {
      throw new Error("Failed to fetch record");
    }
  }

  // General function to fetch many records based on a filter
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

  // General function to fetch a single record by unique identifier
  static async findOne(model: any, where: object) {
    try {
      return await model.findUnique({ where });
    } catch (error) {
      throw new Error("Failed to fetch record");
    }
  }

  // General function to create a record
  static async create(model: any, data: object) {
    try {
      return await model.create({
        data,
      });
    } catch (error) {
      throw new Error("Failed to create record");
    }
  }

  // General function to update a record by unique identifier
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

  // General function to delete a record by unique identifier
  static async delete(model: any, where: object) {
    try {
      return await model.delete({
        where,
      });
    } catch (error) {
      throw new Error("Failed to delete record");
    }
  }

  // General function to delete many records based on a filter
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
