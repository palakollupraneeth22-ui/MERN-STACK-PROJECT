/**
 * Database Utilities and Optimizations
 * Includes query helpers, indexing setup, and performance optimizations
 */

const mongoose = require('mongoose');
const Logger = require('../utils/logger');

const logger = new Logger('DatabaseUtils');

/**
 * Query builder for optimized database queries
 */
class QueryBuilder {
  constructor(query, queryParams) {
    this.query = query;
    this.queryParams = queryParams;
  }

  /**
   * Filter by fields
   */
  filter(allowedFields = []) {
    const filterObj = { ...this.queryParams };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];

    excludedFields.forEach(el => delete filterObj[el]);

    if (allowedFields.length > 0) {
      Object.keys(filterObj).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete filterObj[key];
        }
      });
    }

    // Handle nested fields
    let filterStr = JSON.stringify(filterObj);
    filterStr = filterStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(filterStr));
    return this;
  }

  /**
   * Search functionality
   */
  search(searchFields = []) {
    if (this.queryParams.search && searchFields.length > 0) {
      const searchRegex = new RegExp(this.queryParams.search, 'i');
      const searchCondition = {
        $or: searchFields.map(field => ({
          [field]: searchRegex,
        })),
      };
      this.query = this.query.find(searchCondition);
    }
    return this;
  }

  /**
   * Sort results
   */
  sort() {
    if (this.queryParams.sort) {
      const sortBy = this.queryParams.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  /**
   * Pagination
   */
  paginate() {
    const page = parseInt(this.queryParams.page, 10) || 1;
    const limit = parseInt(this.queryParams.limit, 10) || 10;

    if (limit > 100) {
      throw new Error('Limit cannot exceed 100');
    }

    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  /**
   * Select specific fields
   */
  selectFields() {
    if (this.queryParams.fields) {
      const fields = this.queryParams.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    }
    return this;
  }

  /**
   * Populate relations
   */
  populate(paths = []) {
    paths.forEach(path => {
      this.query = this.query.populate(path);
    });
    return this;
  }

  /**
   * Get query result
   */
  async execute() {
    return await this.query;
  }

  /**
   * Get count
   */
  async count() {
    const countQuery = mongoose.model(this.query.model.modelName).countDocuments(
      this.query.getFilter()
    );
    return await countQuery;
  }
}

/**
 * Setup database indexes for performance
 */
const setupIndexes = async (models) => {
  try {
    // User indexes
    if (models.User) {
      await models.User.collection.createIndex({ email: 1 }, { unique: true });
      await models.User.collection.createIndex({ createdAt: -1 });
    }

    // Course indexes
    if (models.Course) {
      await models.Course.collection.createIndex({ userId: 1 });
      await models.Course.collection.createIndex({ title: 'text', description: 'text' });
      await models.Course.collection.createIndex({ status: 1 });
      await models.Course.collection.createIndex({ createdAt: -1 });
    }

    // Video indexes
    if (models.Video) {
      await models.Video.collection.createIndex({ courseId: 1 });
      await models.Video.collection.createIndex({ userId: 1 });
    }

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes', error);
  }
};

/**
 * Database connection options for optimization
 */
const getConnectionOptions = () => {
  return {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };
};

/**
 * Bulk operation helper
 */
const bulkWrite = async (Model, operations) => {
  try {
    const result = await Model.bulkWrite(operations);
    logger.info(`Bulk write completed: ${result.modifiedCount} modified, ${result.insertedCount} inserted`);
    return result;
  } catch (error) {
    logger.error('Bulk write failed', error);
    throw error;
  }
};

/**
 * Transaction helper for multi-document ACID operations
 */
const withTransaction = async (operation) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Database health check
 */
const healthCheck = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    return { status: 'healthy', connected: true };
  } catch (error) {
    logger.error('Database health check failed', error);
    return { status: 'unhealthy', connected: false, error: error.message };
  }
};

/**
 * Get database stats
 */
const getStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      collections: stats.collections,
      indexes: stats.indexes,
    };
  } catch (error) {
    logger.error('Error getting database stats', error);
    return null;
  }
};

module.exports = {
  QueryBuilder,
  setupIndexes,
  getConnectionOptions,
  bulkWrite,
  withTransaction,
  healthCheck,
  getStats,
};
