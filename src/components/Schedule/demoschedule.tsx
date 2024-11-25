const now = new Date();

export default [
  {
    id: 1,
    title: 'Release Party',
    start: new Date(2024, 11, 25),
    end: new Date(2024, 11, 30),
  },
  {
    id: 14,
    title: 'Wicked',
    start: new Date(new Date().setHours(new Date().getHours() - 3)),
    end: new Date(new Date().setHours(new Date().getHours() + 3)),
  },
  {
    id: 15,
    title: 'Right Now',
    start: now,
    end: now,
  },
];
