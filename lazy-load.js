import Vue from 'vue';
/**
 * only be used for <img>
 * Be careful that it will reset 'onload' and 'onerror' event
 * Please use local image to set 'loading'
 * demo: src='...' -> v-lazyload='...'
 * v-lazyload: string || { src: string, loading: string, reload: boolean }
 */
const RELOAD_INTERVAL = 2000; // 2s
const LIMIT_RELOAD_TIMES = 10;
const RELOAD_QUERY_NAME = 'reloadv';
const LAZYLOAD_SRC = 'lazySrc';
const THRESHOLD = [0, 0.25, 0.5, 0.75, 1];

const io = new IntersectionObserver(entries => {
  entries.forEach(({ intersectionRatio, target }) => {
    if (intersectionRatio > 0) {
      io.unobserve(target);
      target.src = target.dataset[LAZYLOAD_SRC];
    }
  });
}, {
  threshold: THRESHOLD,
});

function resetReoladv(url) {
  return new Promise(resolve => {
    try {
      const newUrl = new URL(url);
      const haveReload = newUrl.searchParams.has(RELOAD_QUERY_NAME);
      const newReloadv = haveReload ? newUrl.searchParams.get(RELOAD_QUERY_NAME) + 1 : 1;
      if (newReloadv > LIMIT_RELOAD_TIMES) {
        resolve('');
      } else {
        newUrl.searchParams.set(RELOAD_QUERY_NAME, newReloadv);
        resolve(newUrl.toString());
      }
    } catch (err) {
      console.error(err);
      resolve('');
    }
  });
}

function parseParam(params) {
  let src = '';
  let loading = '';
  let reload = false;
  if (typeof params === 'string') {
    src = params;
  } else if (typeof params === 'object') {
    src = params?.src || '';
    loading = params?.loading || '';
    reload = params?.reload || false;
  }
  return { src, loading, reload };
}

function lazyloadInit(target) {
  target.onload = null;
  target.onerror = null;
  io.unobserve(target);
  delete target.dataset[LAZYLOAD_SRC];
}
function lazyloadStart(target, binding) {
  const { src, loading, reload } = parseParam(binding.value);
  if (src !== target.dataset[LAZYLOAD_SRC]) {
    lazyloadInit(target);

    target.dataset[LAZYLOAD_SRC] = src;
    const haveLoading = ![null, undefined, ''].includes(loading);
    if (reload) {
      target.onerror = () => {
        if (haveLoading) {
          target.src = loading;
        }
        setTimeout(async () => {
          const newSrc = await resetReoladv(src);
          target.src = newSrc || loading;
        }, RELOAD_INTERVAL);
      }
    }
    if (haveLoading) {
      target.onload = () => {
        target.onload = null;
        io.observe(target);
      };
      target.src = loading;
    } else {
      io.observe(target);
    }
  }
}

Vue.directive('lazyload', {
  bind: lazyloadStart,
  update: lazyloadStart,
  unbind: lazyloadInit,
});
