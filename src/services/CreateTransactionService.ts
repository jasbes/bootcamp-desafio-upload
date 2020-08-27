import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface Request {
  title: string;

  value: number;

  type: 'income' | 'outcome';

  categoryName: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryName,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && balance.total - value <= 0) {
      throw new AppError('There is not enough balance.');
    }

    let category = await categoryRepository.findOne({
      where: { title: categoryName },
    });

    if (!category) {
      category = categoryRepository.create({
        title: categoryName,
      });

      await categoryRepository.save(category);
    }
    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id: category.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
