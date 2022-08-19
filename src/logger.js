module.exports =  (module) => (...messages) => {
  console.log(`${module}: \t`, ...messages);
};
