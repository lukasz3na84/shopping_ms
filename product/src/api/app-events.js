const ProductrService = require("../services/product-service")

module.exports = (app) => {
  const service = new ProductrService()

  app.use('/app-events', (req, res, next) => {
    const { payload } = req.body;
    service.SubscribeEvents(payload);

    console.log("=================== Product Service recorded Event ========== ");
    return res.status(200).json(payload);
  });
}