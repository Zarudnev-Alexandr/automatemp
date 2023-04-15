let searchText = {}
let currentUrl = location.href;
const checkPageTransition = () => {
  requestAnimationFrame(() => {
    if (currentUrl !== window.location.href) {
      chrome.runtime.sendMessage({ command: 'checkEnable' }, (response) => { });
      clearData();
    }
    currentUrl = window.location.href;
  }, true);
};

document.body.addEventListener('click', checkPageTransition);
document.body.addEventListener('keyup', (e) => {
  if (e.code === 'Enter' || e.code === 'Space') checkPageTransition();
});

document.addEventListener('DOMContentLoaded', chrome.runtime.sendMessage({ command: 'checkEnable' }));

function getData() {
  currentUrl = window.location.href;
  if (currentUrl.includes('search=')) {
    let searchTextBegin = currentUrl.search('search=');
    let searchTextEnd = currentUrl.indexOf('#', searchTextBegin);
    let searchTextEnd2 = searchTextEnd === -1 ? currentUrl.indexOf('#', searchTextBegin) : null;
    searchText = searchTextEnd2 === -1 ? currentUrl.slice(searchTextBegin + 7) : currentUrl.slice(searchTextBegin + 7, searchTextEnd);
    searchText = searchText.replaceAll('+', '%20');
    searchText = decodeURI(searchText);
    chrome.runtime.sendMessage({ command: 'getRequests', text: searchText }, (response) => { })
  } else if (currentUrl.includes('wildberries.ru/catalog') && currentUrl.includes('detail.aspx')) {
    var prodId;
    waitForElm('#productNmId').then((elm) => {
      prodId = document.getElementById('productNmId').innerText;
      chrome.runtime.sendMessage({ command: 'cardPromoBlock', id: prodId }, (response) => { })
    })
  }
}

let jsonSearchData = []; //Массив с элементами после поиска все товары
let jsonSearchSpecificData = []; //Массив с подробной инфой о товарах в поиске все товары
let tableCardsData = [];
let priorityCategoriesData = [];
let timeInfoData = [];
let cpmData = [];
let promos = [];

chrome.runtime.onMessage.addListener(function (request, sender, sendResponce) {
  if (request.msg) {
    switch (request.msg) {
      case 'firstBlock':
        jsonSearchData = request.jsonSearchData
        jsonSearchSpecificData = request.jsonSearchSpecificData
        if (jsonSearchData && jsonSearchSpecificData && tableCardsData && priorityCategoriesData && timeInfoData) fillPage();
        break;
      case 'secondBlock':
        tableCardsData = request.tableCardsData
        priorityCategoriesData = request.priorityCategoriesData
        timeInfoData = request.timeInfoData
        if (jsonSearchData && jsonSearchSpecificData && tableCardsData && priorityCategoriesData && timeInfoData) fillPage();
        break;
      case 'cardPromoBlock':
        cpmData = request.cpmData
        if (cpmData) fillCardPage();
        break;
      case 'getPromos':
        promos = request.promos;
        console.log(promos);
        fillPromos(false);
    }
  } else {
    if (request === 200) {
      getData();
    }
  }
});

//   // waitForElm():
//   // Код waitForElm(selector) представляет собой функцию, которая используется для ожидания загрузки элемента на странице. Функция возвращает объект обещания (Promise), который будет разрешен, когда элемент, соответствующий заданному селектору, будет найден на странице.

//   // Первая вещь, которую делает функция, это создает новый объект обещания с помощью конструктора Promise. Это означает, что функция возвращает обещание, которое будет разрешено позже, когда элемент будет найден.

//   // Затем функция проверяет, есть ли элемент на странице, соответствующий заданному селектору, с помощью метода document.querySelector(selector). Если элемент уже есть на странице, функция немедленно разрешает обещание с найденным элементом.

//   // Если элемент не найден, функция создает новый объект MutationObserver, который следит за изменениями в дереве DOM. Затем функция добавляет наблюдателя на document.body, чтобы отслеживать изменения в дереве DOM.

//   // Когда элемент, соответствующий заданному селектору, будет добавлен на страницу, функция разрешит обещание с найденным элементом и отключит наблюдателя, чтобы предотвратить дальнейшее отслеживание изменений в дереве DOM.

//   // Итак, в целом, функция waitForElm(selector) используется для ожидания загрузки элемента на странице и возвращает объект обещания, который будет разрешен, когда элемент будет найден на странице. Это может быть полезно, например, когда вы хотите выполнить какой-то код, только когда элемент на странице доступен для использования.
//   // ```
function waitForElm(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }
    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

function fillPage() {
  if (jsonSearchData.length != 0 && jsonSearchSpecificData.length != 0 && tableCardsData.length != 0 && priorityCategoriesData.length != 0 && timeInfoData.length != 0) {
    waitForElm('.catalog-page__searching-results').then((elm) => {
      elm.insertAdjacentHTML(
        'beforeend',
        `
        <div class="automatempBlock" id="automatempBlock">
          <div class="automatempBlock__inner">
            <div class="automatempBlock__logoButton">
              <a class="automatempBlock__logo__link" href="https://automate-mp.ru/">
                <img class="automatempBlock__logo1" src="https://static.tildacdn.com/tild3039-6432-4739-b839-313265366638/d2d4e200-dc87-4d6c-a.svg"/>
                <img class="automatempBlock__logo2" src="https://static.tildacdn.com/tild3436-3731-4466-b732-646465616236/1401a47a-25ef-4d45-b.svg"/>
              </a>
              <button class="automatemp__logoButton__button btn-main" onClick="alert('Функционал пока в разработке')">Скачать выдачу</button>
            </div>
          </div>

          <div class="automatempBlock__items" id="automatempBlock__items">
          </div>
          <button class="automatempBlock__wholeAuction" id="wholeAuction__id">Весь аукцион</button>
        </div>
      `
      );
      // Скрытие и показ основного блока
      document.querySelector('#wholeAuction__id').addEventListener('click', function () {
        document.querySelector('#categoryPriorityId').classList.toggle('hide');
      });

      waitForElm('#automatempBlock__items').then((elm1) => {

        jsonSearchData.slice(0, 10).forEach((item, index) => {
          jsonSearchSpecificData.forEach((item1) => {
            if (item.id == item1.id) {
              elm1.insertAdjacentHTML('beforeend',
                `
                <div class="automatempBlock__item">
                  <div class="automatempBlock__item__inner">
                    <img class="automatempBlock__item__img" src="https:${ImgLinkSlice(item1.id)}/images/big/1.jpg" />
                    <div class="automatempBlock__item__box automatempBlock__item__box1">
                      <h6 class="automatempBlock__item__title">${item1.name}</h6>
                      <p class="automatempBlock__item__label">${item1.brand}</p>
                      <div class="automatempBlock__item__addition">
                        <p class="automatempBlock__item__price">${new Intl.NumberFormat('ru-RU').format(item.cpm)} ₽</p>
                        <p class="automatempBlock__item__time">${item1.time1 + item1.time2}ч</p>
                      </div>
                    </div>
                    <div class="automatempBlock__item__box automatempBlock__item__box2">
                      <p class="automatempBlock__item__place">${index + 1}</p>
                      <a class="automatempBlock__item__share__link" href="https://www.wildberries.ru/catalog/${item1.id}/detail.aspx">
                        <img class="automatempBlock__item__share" src="https://www.svgrepo.com/show/471880/share-04.svg" />
                      </a>
                    </div>
                  </div>
                </div>
              `
              );
            }
          });
        });

        document.getElementById('automatempBlock').insertAdjacentHTML('beforeend',
          `
          <div class="categoryPriority hide" id="categoryPriorityId">
            <div class="categoryPriority__inner">
              <h1 class="categoryPriority__title">Приоритет категорий</h1>
              <div class="categoryPriority__wrapper1">
                <table class="categoryPriority__table categoryPriority__table1">
                  <thead class="categoryPriority__thead">
                    <tr class="categoryPriority__thead__tr">
                      <th class="categoryPriority__thead__th">№</th>
                      <th class="categoryPriority__thead__th">Категория</th>
                      <th class="categoryPriority__thead__th">Кол-во товаров</th>
                      <th class="categoryPriority__thead__th">Доля категории</th>
                    </tr>
                  </thead>
                  <tbody class="categoryPriority__tbody" id="categoryPriority__tbody">
                  </tbody>
                </table>

                <div class="categoryPriority__deliveryTime__box" id="categoryPriority__deliveryTime__box">
                </div>
              </div>

              <div class="categoryPriority__wrapper2">
                <div class="categoryPriority__wrapper2__topbox">
                  <h1 class="categoryPriority__title">Ставки и приоритеты</h1>
                  <div class="categoryPriority__checkbox__box">
                    <label class="categoryPriority__checkbox">
                      <input class="categoryPriority__input" type="checkbox" onClick="alert('Функционал пока в разработке')">
                      <span class="categoryPriority__switch"></span>
                    </label>
                    <p class="categoryPriority__checkbox__title">Скрыть не активные</p>
                  </div>
                </div>
                <table class="categoryPriority__table categoryPriority__table2">
                  <thead class="categoryPriority__thead">
                    <tr class="categoryPriority__thead__tr">
                      <th class="categoryPriority__thead__th">Фото</th>
                      <th class="categoryPriority__thead__th">Страница</th>
                      <th class="categoryPriority__thead__th">Позиция</th>
                      <th class="categoryPriority__thead__th">Категория</th>
                      <th class="categoryPriority__thead__th">Бренд</th>
                      <th class="categoryPriority__thead__th">Рейтинг</th>
                      <th class="categoryPriority__thead__th">Остаток</th>
                      <th class="categoryPriority__thead__th">Срок доставки</th>
                      <th class="categoryPriority__thead__th">Ставка</th>
                    </tr>
                  </thead>
                  <tbody class="categoryPriority__tbody" id="categoryPriority__tbody1">
                  </tbody>
                </table>

              </div>
            </div>
          </div>
        `
        );
      });
      waitForElm('#categoryPriority__tbody').then((elm) => {
        if (
          (priorityCategoriesData.length !== 0 && timeInfoData.length !== 0) ||
          tableCardsData.length !== 0
        ) {
          // console.log(priorityCategoriesData);
          // console.log(timeInfoData);
          // console.log(tableCardsData);
          priorityCategoriesData.forEach((item, index) => {
            document.getElementById('categoryPriority__tbody').insertAdjacentHTML(
              'beforeend',
              `
            <tr class="categoryPriority__tbody__tr">
              <td class="categoryPriority__tbody__td">${index + 1}</td>
              <td class="categoryPriority__tbody__td">${item.name}</td>
              <td class="categoryPriority__tbody__td">${item.count}</td>
              <td class="categoryPriority__tbody__td">${item.percent_part}%</td>
            </tr>
          `
            );
          });

          document
            .getElementById('categoryPriority__deliveryTime__box')
            .insertAdjacentHTML(
              'beforeend',
              `
          <div class="categoryPriority__deliveryTime__item">
            <p class="categoryPriority__deliveryTime__item__title">мин. время доставки</p>
            <p class= "categoryPriority__deliveryTime__item__time">${timeInfoData.min} час.</p>
          </div>
          <div class="categoryPriority__deliveryTime__item">
            <p class="categoryPriority__deliveryTime__item__title">макс. время доставки</p>
            <p class="categoryPriority__deliveryTime__item__time red__time">${timeInfoData.max} час.</p>
          </div>
        `
            );

          tableCardsData.forEach((item, index) => {
            document
              .getElementById('categoryPriority__tbody1')
              .insertAdjacentHTML(
                'beforeend',
                `
            <tr class="categoryPriority__tbody__tr">
              <td class="categoryPriority__tbody__td categoryPriority__tbody__td__withimg">
                <a class="categoryPriority__tbody__td__img__link" href="https://www.wildberries.ru/catalog/${item.id}/detail.aspx">
                <img class="categoryPriority__tbody__td__img" src="https:${ImgLinkSlice(
                  item.id
                )}/images/big/1.jpg"/>
                </a>
              </td>
              <td class="categoryPriority__tbody__td">${item.page}</td>
              <td class="categoryPriority__tbody__td">${item.pos}</td>
              <td class="categoryPriority__tbody__td">${item.category}</td>
              <td class="categoryPriority__tbody__td">${item.brand}</td>
              <td class="categoryPriority__tbody__td">${item.rating}</td>
              <td class="categoryPriority__tbody__td">${item.quantity}</td>
              <td class="categoryPriority__tbody__td">${item.time} ч</td>
              <td class="categoryPriority__tbody__td">${new Intl.NumberFormat('ru-RU').format(item.cpm)} ₽</td>
            </tr>
          `
              );
          });
        } else {
          setTimeout(renderSecondBlock, 250);
        }
      });
    });
    waitForElm('.product-card-overflow').then((elm) => {
      chrome.runtime.sendMessage({ command: 'getPromos', text: searchText }, (response) => {
      })
    })
  } 
}



function fillCardPage() {
  if (cpmData.length !== 0) {
    waitForElm('.product-page__goods-slider--promo').then((elm) => {
      elm.insertAdjacentHTML('beforebegin', `
        <div class="automatempBlock__card__block" id="automatempBlock__card__block">
          <div class="automatempBlock__card__inner">
            <h6 class="automatempBlock__card__title">Рекламные ставки</h6>
            <ul class="automatempBlock__card__list" id="automatempBlock__card__list">
            </ul>
          </div>
        </div>
      `)
    })
    waitForElm('#automatempBlock__card__list').then((elm)=>{
      cpmData.forEach((item, index) => {
        elm.insertAdjacentHTML('beforeend', `
          <li class="automatempBlock__card__list__item">${index + 1} - ${new Intl.NumberFormat('ru-RU').format(item.cpm) }</li>
        `)
      });
    })
  }
}

function ImgLinkSlice(nmId) {
  const nm = parseInt(nmId, 10),
    vol = ~~(nm / 1e5),
    part = ~~(nm / 1e3);

  const host =
    vol >= 0 && vol <= 143
      ? '//basket-01.wb.ru'
      : vol >= 144 && vol <= 287
        ? '//basket-02.wb.ru'
        : vol >= 288 && vol <= 431
          ? '//basket-03.wb.ru'
          : vol >= 432 && vol <= 719
            ? '//basket-04.wb.ru'
            : vol >= 720 && vol <= 1007
              ? '//basket-05.wb.ru'
              : vol >= 1008 && vol <= 1061
                ? '//basket-06.wb.ru'
                : vol >= 1062 && vol <= 1115
                  ? '//basket-07.wb.ru'
                  : vol >= 1116 && vol <= 1169
                    ? '//basket-08.wb.ru'
                    : vol >= 1170 && vol <= 1313
                      ? '//basket-09.wb.ru'
                      : vol >= 1314 && vol <= 1601
                        ? '//basket-10.wb.ru'
                        : vol >= 1602 && vol <= 1655
                          ? '//basket-11.wb.ru'
                          : '//basket-12.wb.ru';

  return `${host}/vol${vol}/part${part}/${nm}`;
}

function fillPromos(wheel) {
  var cards = [...document.getElementsByClassName('product-card__main j-card-link')];
  if (wheel && cards.length > 10) {
    cards = [...document.getElementsByClassName('product-card__main j-card-link')].splice(cards.length - 10);
  }
  if (promos.length != 0){
    promos.adverts.forEach(code => {
      var foundPromo = cards.find(card => { if (card.attributes[2].value.includes(`/${code.id}/`)) return true });
      if (foundPromo && !foundPromo.querySelector('.automatempBlock__promo__card')) {
        foundPromo.children[0].classList.add('automatempBlock__promo__card__img')
        let el = foundPromo.querySelector('.product-card__tip--promo')
        el.innerHTML = `Промотовар - ${new Intl.NumberFormat('ru-RU').format(code.cpm) } ₽`;
      }
    })
  }
}

document.body.addEventListener('wheel', (event) => {
  event.wheelDeltaY < 0 ? fillPromos(true) : null;
})

function clearData() {
  currentUrl = window.location.href;
  if (
    currentUrl.includes('wildberries.ru/catalog') &&
    currentUrl.includes('search.aspx')
  ) {
    jsonSearchData.length = 0;
    jsonSearchSpecificData.length = 0;
    tableCardsData.length = 0;
    priorityCategoriesData.length = 0;
    let el = document.getElementById('automatempBlock');
    el.parentNode.removeChild(el);
  } else if (currentUrl.includes('detail.aspx')){
    cpmData.length = 0;
    let el = document.getElementById('automatempBlock__card__block');
    el.parentNode.removeChild(el);
  }
}

