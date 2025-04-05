import ArticlesModel from '../model/Article.js';

export const save = async (articleData) => {
  try {
    const article = new ArticlesModel(articleData);
    return await article.save();
  } catch (error) {
    throw error;
  }
};

export const get = async (articleId) => {
  try {
    const article = await ArticlesModel.findOne({ articleId: articleId }).exec();
    return article;
  } catch (error) {
    throw error;
  }
};

export const getAll = async () => {
  try {
    return await ArticlesModel.find({}).exec();
  } catch (error) {
    throw error;
  }
};

export const updateById = async (articleId, updateData) => {
  try {
    return await ArticlesModel.findOneAndUpdate(
      { articleId: articleId },
      updateData,
      { new: true }
    ).exec();
  } catch (error) {
    throw error;
  }
};

export const deleteById = async (articleId) => {
  try {
    return await ArticlesModel.findOneAndDelete({ articleId: articleId }).exec();
  } catch (error) {
    throw error;
  }
};

