const { ProductRepository } = require("../database");
const { FormateData } = require("../utils");
const { APIError, NotFoundException } = require('../utils/app-errors');

// All Business logic will be here
class ProductService {

    constructor() {
        this.repository = new ProductRepository();
    }

    async CreateProduct(productInputs) {
        try {
            const productResult = await this.repository.CreateProduct(productInputs)
            return FormateData(productResult);
        } catch (err) {
            throw new APIError('Data Not found')
        }
    }

    async GetProducts() {
        try {
            const products = await this.repository.Products();

            const categoriesSet = new Set();

            products.forEach(({ type }) => {
                categoriesSet.add(type);
            });

            return FormateData({
                products,
                categories: [...categoriesSet],
            });

        } catch (err) {
            throw new APIError('Data Not found');
        }
    }

    async GetProductDescription(productId) {
        try {
            const product = await this.repository.FindById(productId);
            return FormateData(product)
        } catch (err) {
            throw new APIError('Data Not found')
        }
    }

    async GetProductsByCategory(category) {
        try {
            const products = await this.repository.FindByCategory(category);
            return FormateData(products)
        } catch (err) {
            throw new APIError('Data Not found')
        }

    }

    async GetSelectedProducts(selectedIds) {
        try {
            const products = await this.repository.FindSelectedProducts(selectedIds);
            return FormateData(products);
        } catch (err) {
            throw new APIError('Data Not found')
        }
    }

    async GetProductById(productId) {
        try {
            return await this.repository.FindById(productId);
        } catch (err) {
            throw new APIError('Data Not found')
        }
    }

    async GetProductPayload(userId, { productId, qty }, event) {
        const product = await this.repository.FindById(productId);

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        if (product) {
            const payload = {
                event: event,
                data: {
                    userId,
                    product,
                    qty,
                }
            }

            return FormateData(payload);
        } else {
            return FormateData({ error: "No product available" });
        }
    }

}

module.exports = ProductService;