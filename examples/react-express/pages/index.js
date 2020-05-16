import React from 'react';
import { MonerisTestComponent } from '../components/MonerisTestComponent';

export default () => {
  const values = {
    name: 'Your name',
    email: 'something@example.com',
    postalCode: 'H2Y 2A2',
  };
  return (
    <div>
      <MonerisTestComponent values={values} />
    </div>
  );
};
