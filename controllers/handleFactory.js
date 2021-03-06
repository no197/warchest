const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures.js');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('Không tìm thấy dữ liệu với ID cần tìm.', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('Không tìm thấy dữ liệu với Id cần tìm.', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    if (req.params.id) req.body.user = req.params.id;
    if (req.user) req.body.user = req.user._id;

    let doc = await Model.create(req.body);

    if (popOptions) {
      doc = await Model.findById(doc._id).populate(popOptions);
    }

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('Không tìm thấy dữ liệu với Id cần tìm.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET
    let filter = {};
    // trick for find nofication for user
    const { product, user } = req.params;
    if (product) filter = { ...filter, product, user: `${req.user._id}` };

    if (user) filter = { ...filter, user };

    const getTotalDocs = new APIFeatures(
      Model.find(filter),
      req.query
    ).getTotalDocs();

    const total = await getTotalDocs.query;

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();
    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      total,
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
