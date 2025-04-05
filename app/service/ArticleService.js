import ArticlesModel from '../model/Article';

export const save = async (articleData) => {
    const article = new ArticlesModel(articleData);
    return await article.save();
  };

  export const get = async (articleId) => {
    const article = await ArticlesModel.findOne({ article: articleId }).exec();
    return article;
  };

