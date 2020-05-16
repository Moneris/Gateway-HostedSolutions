import React from 'react';
import axios from 'axios';

const submitToken = (values, apiUrl) => async ({ dataKey }) => {
  const url = `${apiUrl}`;
  const body = {
    ...values,
    token: dataKey,
  };
  const response = await axios
    .post(url, body, {
      headers: { 'Content-Type': 'application/json' },
    })
    .catch((error) => error.response);

  const { data = {} } = response || {};
  if (response.status < 200 || response.status > 299) {
    console.error({ response });
    const error = new Error((data && data.message) || response.statusText);
    error.response = response;
    throw error;
  }

  if (!data.success && data.message) {
    return Promise.reject(data.message);
  }
  return data;
};
// const profileId = 'htBHPQKVN64PHZE'; //	http://troismats.net
export const defer = () => {
  return (() => {
    let resolve;
    let reject;

    let p = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return {
      promise: p,
      reject,
      resolve,
    };
  })();
};

export const useMoneris = (containerId, frameId, url, profile, apiUrl) => {
  let deferred;
  const doMonerisSubmit = (values) => {
    deferred = defer();
    const monFrameRef = document.getElementById(frameId).contentWindow;
    monFrameRef.postMessage('tokenize', url);

    return deferred.promise.then(submitToken(values, apiUrl));
  };
  const respMsg = ({ data }) => {
    const { bin, dataKey, errorMessage } = JSON.parse(data);
    if (errorMessage) {
      deferred.reject(errorMessage);
    } else {
      deferred.resolve({ bin, dataKey });
    }
  };

  React.useEffect(() => {
    const params = [
      `id=${profile}`,
      `enable_exp=1`,
      `enable_cvd=1`,
      `display_labels=1`,
      `pan_label=Carte`,
      `cvd_label=CVC`,
      `exp_label=Expiration (MMAA)`,
      'css_body=' +
        encodeURIComponent(
          'background:#eeeeee;' +
            'border: 1px solid #C3C3C3;' +
            'padding: 2.25rem 1rem 0rem 1rem;' +
            'font-family:sans-serif;'
        ),
      'css_textbox=' +
        encodeURIComponent(
          'border: 1px solid #C3C3C3;' +
            'width: 320px;' +
            'background:white;' +
            'margin-left: 1rem;' +
            'margin-top: .25rem;' +
            'margin-bottom: 1rem;' +
            'padding:.375rem .75rem;'
        ),
      'css_input_label=' + encodeURIComponent('font-size: 16px;margin-left: 1rem;'),
    ];
    const frame = document.getElementById(frameId);
    const src = `${url}?${params.join('&')}`;
    window.addEventListener('message', respMsg, false);
    frame.src = src;
    return () => window.removeEventListener('message', respMsg, false);
  }, []);

  return { doMonerisSubmit };
};
