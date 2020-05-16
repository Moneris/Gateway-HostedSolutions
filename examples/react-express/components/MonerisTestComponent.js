import React from 'react';
import { useMoneris } from './useMoneris';
import { apiUrl, monerisUrl, profileId } from '../config/clientConfig';

const monerisFrameId = 'monerisFrame';
const monerisContainerId = 'monerisContainer';

export function MonerisTestComponent({ values }) {
  const { doMonerisSubmit } = useMoneris(monerisContainerId, monerisFrameId, monerisUrl, profileId, apiUrl);
  const submit = () => {
    doMonerisSubmit(values)
      .then((data) => {
        console.log({ data });
      })
      .catch((errorMessage) => {
        console.error({ errorMessage });
      });
  };
  return (
    <div id={monerisContainerId}>
      <div>
        <iframe frameBorder={0} id={monerisFrameId} width="480px" height="260px" />
      </div>
      <input type="button" onClick={submit} value="submit iframe" />
    </div>
  );
}
