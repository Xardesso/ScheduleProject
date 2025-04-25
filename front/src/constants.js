export const days  = ['Pon','Wt','Śr','Czw','Pt','Sb','Nd'];
export const hours = [...Array(8)].map((_,i) => 9 + i); // 9–16
export const areas = [
  { id: 'customer',    name: 'Obsługa klienta'      },
  { id: 'acquisition', name: 'Pozyskiwanie klienta' },
  { id: 'tech',        name: 'Wsparcie techniczne'  }
];