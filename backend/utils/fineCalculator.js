const calculateFine = (dueDate, returnDate, dailyFine) => {
  if (!returnDate || returnDate <= dueDate) {
    return 0;
  }
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.ceil((returnDate - dueDate) / msPerDay);
  return diffDays * dailyFine;
};

module.exports = calculateFine;
