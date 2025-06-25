// Handlebars mock
const handlebars = {
  compile: jest.fn().mockReturnValue((data) => `Compiled template with ${JSON.stringify(data)}`),
  registerHelper: jest.fn(),
  registerPartial: jest.fn(),
  create: jest.fn().mockReturnValue({
    compile: jest.fn().mockReturnValue((data) => `Compiled template with ${JSON.stringify(data)}`),
  }),
};

module.exports = handlebars;
