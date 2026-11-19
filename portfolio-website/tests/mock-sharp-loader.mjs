export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'sharp') {
    return {
      url: 'data:text/javascript,export%20default%20function%20sharp()%7Bthrow%20new%20Error(%22Sharp%20is%20stubbed%20for%20HTTP%20route%20tests%20only%22)%7D',
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
