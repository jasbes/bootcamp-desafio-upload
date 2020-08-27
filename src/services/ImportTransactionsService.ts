import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getRepository, getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import Category from '../models/Category';
import TransactionsReporitory from '../repositories/TransactionsRepository';
import CreateTransactionService from './CreateTransactionService';

interface TransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  categoryName: string;
}

class ImportTransactionsService {
  async execute(fileName: string): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsReporitory);
    const createTransactionService = new CreateTransactionService();

    const csvFilePath = path.resolve(uploadConfig.directory, fileName);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const csvTransactions: TransactionCSV[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, categoryName] = line;

      csvTransactions.push({ title, type, value, categoryName });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const transactions: Transaction[] = [];
    for (const csvTransaction of csvTransactions) {
      const transaction = await createTransactionService.execute(
        csvTransaction,
      );

      transactions.push(transaction);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
