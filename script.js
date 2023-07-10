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
    chrome.runtime.sendMessage({ command: 'getRequests', text: getFromSearch() }, (response) => { })
  } else if (currentUrl.includes('wildberries.ru/catalog') && currentUrl.includes('detail.aspx')) {
    var prodId;
    waitForElm('#productNmId').then((elm) => {
      prodId = document.getElementById('productNmId').innerText;
      chrome.runtime.sendMessage({ command: 'cardPromoBlock', id: prodId }, (response) => { })
      chrome.runtime.sendMessage({ command: 'unitEconom', id: prodId }, (response) => { })
    })

    waitForElm(`.certificate-check`).then((elm) => {

      var items = document.getElementsByClassName('certificate-check__wrap');
      for (let i = 0; i < items.length; i++) {
        let element = items[i];
        element.style.display = 'none';
      }
      waitForElm('#automatempSertif').then((elm1) => {
        elm1.style.display = 'flex'
      })
      fillCertificate();
    })

    waitForElm('.product-page__aside-container').then((elm) => {
      fillWarehouses(true);
    })

    waitForElm('.product-order-quantity').then((elm) => {
      fillReleaseData(elm);
    })

    waitForElm('.user-activity__tabs').then(elm => {
      fillAddQuestion(elm);
    })

    waitForElm('.mix-block__find-similar.j-wba-card-item.j-find-similar').then(elm => {
      fillCardPageMainImg(elm);
    })

  } else if (currentUrl.includes('wildberries.ru/catalog') && currentUrl.includes('feedbacks')) {//Отзывы
    let prodId = currentUrl.split('/')[4]
    chrome.runtime.sendMessage({ command: 'feedbacks', id: prodId });
  } else if (currentUrl.includes('wildberries.ru/brands')) {
    console.log('Бренды');
    fillLikesOnBrand();
  }
}

let jsonSearchData = []; //Массив с элементами после поиска все товары
let jsonSearchSpecificData = []; //Массив с подробной инфой о товарах в поиске все товары
let tableCardsData = [];
let priorityCategoriesData = [];
let timeInfoData = [];
let cpmData = [];
let promos = [];
let size = [];
let commissions = [];
let wareHouses = [];
let logistic = [];
let certificate = [];
let feedbacks = [];

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
        fillPromos(false);
        break;
      case 'getUnitEconom':
        size = request.size
        commissions = request.commissions
        wareHouses = request.wareHouses
        if (size.length !== 0 && commissions.length !== 0 && wareHouses.length !== 0) {
          var prodId;
          waitForElm('#productNmId').then((elm) => {
            prodId = document.getElementById('productNmId').innerText;
            chrome.runtime.sendMessage({ command: 'logistic', article_id: prodId, warehouse_id: wareHouses[0].id }, (response) => { })
          })
        }
      case 'getLogistic':
        logistic = request.logistic
        if (size && commissions && wareHouses && logistic && !document.getElementById('autmatemp__unitEconom__block')) { unitEconomFillPage() } else {
          rewriteLogistic();
        }
      case 'getFeedbacks':
        feedbacks = request.feedbacks
        if (feedbacks.length != 0) {
          fillFeedbacks();
        }
    }
  } else {
    if (request === 200) {
      getData();
    }
  }
});

//==================================
//Главная страница WB---------------
//==================================

function fillPage() {//Основная страница (10 карточек товаров и аукцион)
  if (jsonSearchData.length != 0 && jsonSearchSpecificData.length != 0 && tableCardsData.length != 0 && priorityCategoriesData.length != 0 && timeInfoData.length != 0) {
    console.log('fillpage');

    waitForElm('.catalog-page__searching-results').then((elm) => {
      elm.insertAdjacentHTML(
        'beforeend',
        `
        <div class="automatemp__countRequest">
          <div class="automatemp__countRequest-items">
          </div>
        </div>

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
          <button class="automatempBlock__wholeAuction" id="wholeAuction__id">Показать аукцион</button>
        </div>
      `
      );

      chrome.runtime.sendMessage({ command: 'countRequest', query: getFromSearch() }, (response) => {
        if (response.length != 0) {
          response.forEach(item => {
            document.querySelector(".automatemp__countRequest-items").insertAdjacentHTML('beforeend', `
              <div class="automatemp__countRequest-item">
                <div class="automatemp__countRequest-item__titlebox">
                  <h4 class="automatemp__countRequest-item__title">${new Intl.NumberFormat('ru-RU').format(item.frequency)}</h4>
                  <img class="automatemp__countRequest-item__img" src="${item.diff > 0 ?
                "https://4947.ru/wb_extension/images/season_arrow_up.svg" : (item.diff < 0 ?
                  "https://4947.ru/wb_extension/images/season_arrow_down.svg" : "")}"/>
                  <h4 class="automatemp__countRequest-item__diff">${item.diff != 0 ? Math.abs(item.diff) + " %" : "-"}</h4>
                </div>
                <p class="automatemp__countRequest-item__period">${item.date_type == "week" ? "запросов за неделю" :
                (item.date_type == "month" ? "запросов за мес." : "запросов за 3 мес.")}</p>
              </div>
            `)
          })
        }
      });

      // Скрытие и показ основного блока
      document.querySelector('#wholeAuction__id').addEventListener('click', function () {
        document.querySelector('#categoryPriorityId').classList.toggle('hide');
        if (document.querySelector('#categoryPriorityId').classList.contains('hide')) {
          document.querySelector('#wholeAuction__id').textContent = 'Показать ауцкцион'
        } else {
          document.querySelector('#wholeAuction__id').textContent = 'Скрыть ауцкцион'
        }
      });

      waitForElm('#automatempBlock__items').then((elm1) => {

        jsonSearchData.slice(0, 10).forEach((item, index) => {
          jsonSearchSpecificData.forEach((item1) => {
            if (item.id == item1.id) {
              elm1.insertAdjacentHTML('beforeend',
                `
                <div class="automatempBlock__item">
                  <div class="automatempBlock__item__inner">
                    <a href="https://www.wildberries.ru/catalog/${item1.id}/detail.aspx" target="_blank"> 
                      <img class="automatempBlock__item__img" src="https:${ImgLinkSlice(item1.id)}/images/big/1.jpg" />
                    </a>
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
                      <a class="automatempBlock__item__share__link" href="https://www.wildberries.ru/catalog/${item1.id}/detail.aspx" target="_blank">
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

//==================================
//Страница товара-------------------
//==================================

function unitEconomFillPage() {//Юнит экономика
  if (size.length !== 0 && commissions.length !== 0 && wareHouses.length !== 0 && logistic.length !== 0) {
    waitForElm('.product-page__details-section').then((elm) => {
      elm.insertAdjacentHTML('beforeend', `
    <div class="autmatemp__unitEconom__block" id="autmatemp__unitEconom__block">
      <h2 class="automatemp__unitEconom__title">Юнит экономика</h2>

      <div class="details-section__details details-section__details--about details">
        <div class="details__content collapsable"
          data-link="class{merge: !(selectedNomenclature^groupedAddedOptions &amp;&amp; selectedNomenclature^groupedAddedOptions^length > 0) toggle='hide'}">
          <div
            data-link="{collapsibleBlock btnClass='j-parameters-btn j-wba-card-item j-wba-card-item-show' nameForWba='Item_Parameters_More' itemSelector='.j-add-info-section' maxCollapsedHeight=(~wbSettings^displayMode=='m' ? 76 : 224) collapsedMsg='Развернуть характеристики' unCollapsedMsg='Свернуть характеристики' useGradient=true}"
            data-jsv="#345^/345^">
            <div class="collapsable__content j-add-info-section" id="automatemp__collapsable"  -webkit-line-clamp: initial;">
              <div class="product-params"
                data-link="{include tmpl='productCardOptions' ^~groupedAddedOptions=selectedNomenclature^groupedAddedOptions ~showCategoryName=true}">

                <table class="product-params__table">
                  <caption data-jsv="#346^#159_" class="product-params__caption">Габариты</caption>
                  <tbody data-jsv="/159_/346^" data-jsv-df="">
                    <tr data-jsv="#395^#160_#161_" class="product-params__row">
                      <th class="product-params__cell"> 
                        <span class="product-params__cell-decor">
                          <span>Высота упаковки</span>
                        </span>
                      </th>
                      <td class="product-params__cell">
                        <span>${size.height} см</span>
                      </td>
                    </tr>
                    <tr data-jsv="#395^#160_#161_" class="product-params__row">
                      <th class="product-params__cell"> 
                        <span class="product-params__cell-decor">
                          <span>Ширина упаковки</span>
                        </span>
                      </th>
                      <td class="product-params__cell">
                        <span>${size.width} см</span>
                      </td>
                    </tr>
                    <tr data-jsv="#395^#160_#161_" class="product-params__row">
                      <th class="product-params__cell"> 
                        <span class="product-params__cell-decor">
                          <span>Длина упаковки</span>
                        </span>
                      </th>
                      <td class="product-params__cell">
                        <span>${size.length} см</span>
                      </td>
                    </tr>
                    <tr data-jsv="#395^#160_#161_" class="product-params__row">
                      <th class="product-params__cell"> 
                        <span class="product-params__cell-decor">
                          <span>Объем</span>
                        </span>
                      </th>
                      <td class="product-params__cell">
                        <span>${size.weight} л</span>
                      </td>
                    </tr>
                    <tr data-jsv="#395^#160_#161_" class="product-params__row">
                      <th class="product-params__cell"> 
                        <span class="product-params__cell-decor">
                          <span>КГТ</span>
                        </span>
                      </th>
                      <td class="product-params__cell">
                        <span>${size.is_kgt ? 'Да' : 'Нет'}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table class="product-params__table">
                  <caption data-jsv="#346^#159_" class="product-params__caption">Комиссия *</caption>
                  <tbody data-jsv="/159_/346^" data-jsv-df="">
                    <tr data-jsv="#395^#160_#161_" class="product-params__row">
                      <th class="product-params__cell"> 
                        <span class="product-params__cell-decor">
                          <span>FBO</span>
                        </span>
                      </th>
                      <td class="product-params__cell">
                        <span>${commissions.fbo.part}% - ${commissions.fbo.amount} ₽</span>
                      </td>
                    </tr>
                    <tr data-jsv="#395^#160_#161_" class="product-params__row">
                      <th class="product-params__cell"> 
                        <span class="product-params__cell-decor">
                          <span>FBS</span>
                        </span>
                      </th>
                      <td class="product-params__cell">
                        <span>${commissions.fbs.part}% - ${commissions.fbs.amount} ₽</span>
                      </td>
                    </tr>
                  </tbody>
                </table>


                <h3 class="product-params__caption automatemp__unitEconom__table__title">Логистика, хранение и приёмка *</h3>
                <select class="automatemp__unitEconom__select automatemp__unitEconom__select-unit" id="automatemp__unitEconom__select">
                </select>

                <table class="product-params__table automatemp__logistic__table">
                  <tbody class="automatemp__logistic__table__tbody">
                    <tr class="product-params__row">
                      <th class="product-params__cell"> 
                        <span class="product-params__cell-decor">
                          <span>Логистика</span>
                        </span>
                      </th>
                      <td class="product-params__cell">
                        <span id="automatemp__logistic__table__amount">${logistic.logistic_amount} ₽</span>
                      </td>
                    </tr>
                    <tr class="product-params__row">
                      <th class="product-params__cell"> 
                        <span class="product-params__cell-decor">
                          <span>От клиента</span>
                        </span>
                      </th>
                      <td class="product-params__cell">
                        <span id="automatemp__logistic__table__from_client">${logistic.from_client} ₽</span>
                      </td>
                    </tr>
                    <tr class="product-params__row">
                      <th class="product-params__cell"> 
                        <span class="product-params__cell-decor">
                          <span>Хранение</span>
                        </span>
                      </th>
                      <td class="product-params__cell">
                        <span id="automatemp__logistic__table__storage_amount">${logistic.storage_amount} ₽ в день</span>
                      </td>
                    </tr>
                    <tr data-jsv="#395^#160_#161_" class="product-params__row">
                      <th class="product-params__cell"> 
                        <span class="product-params__cell-decor">
                          <span>Приемка</span>
                        </span>
                      </th>
                      <td class="product-params__cell">
                        <span id="automatemp__logistic__table__reception">${logistic.reception_amount > 0 ? `x${logistic.reception_amount}` : logistic.reception_amount === 0 ? 'бесплатно' : 'недоступно'}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <h3 class="product-params__caption automatemp__unitEconom__table__title">Расчеты</h3>
                <form class="automatemp__unitEconom-calcForm">
                  <select class="automatemp__unitEconom__select automatemp__unitEconom__select-delivery_type" id="#automatemp__unitEconom__select-delivery_type" size="1">
                    <option value="fbo">FBO</option>
                  </select>
                  <div class="automatemp__unitEconom-input__box">
                    <input class="automatemp__unitEconom-input" type="float" id="automatemp__unitEconom-input__purchase_price" placeholder="Цена закупки, ₽">
                  </div>
                  <div class="automatemp__unitEconom-input__box">
                    <input class="automatemp__unitEconom-input" type="float" id="automatemp__unitEconom-input__additional" placeholder="Доп. (упаковка, этикетки, ФФ), ₽">
                  </div>
                  <div class="automatemp__unitEconom-input__box">
                    <input class="automatemp__unitEconom-input" type="float" id="automatemp__unitEconom-input__logistic_to_mp" placeholder="Логистика до МП, ₽">
                  </div>
                  <div class="automatemp__unitEconom-input__box">
                    <input class="automatemp__unitEconom-input" type="float" id="automatemp__unitEconom-input__wrap_days" placeholder="Оборачиваемость, дн">
                  </div>
                  <div class="automatemp__unitEconom-input__box">
                    <input class="automatemp__unitEconom-input" type="int" id="automatemp__unitEconom-input__redemtion_percent" placeholder="Процент выкупа, %">
                  </div>
                  <div class="automatemp__unitEconom-input__box">
                    <input class="automatemp__unitEconom-input" type="int" id="automatemp__unitEconom-input__merriage_percent" placeholder="Процент брака, %">
                  </div>
                  <div class="automatemp__unitEconom-input__box">
                    <input class="automatemp__unitEconom-input" type="int" id="automatemp__unitEconom-input__tax_rate" placeholder="Налоговая ставка, %">
                  </div>
                  <div class="automatemp__unitEconom-input__box">
                    <input class="automatemp__unitEconom-input" type="int" id="automatemp__unitEconom-input__profit_target" placeholder="Цель по прибыли, ₽">
                  </div>
                  <button class="btn-base automatemp__unitEconom-calculation__submit" type="submit">
                    Посчитать
                  </button>
                </form>                
              </div>
            </div>
            <div class="collapsible__bottom">
              <div class="collapsible__gradient" id="automatemp__collapsible__gradient" data-link="class{merge: !isCollapsed toggle='hide'}"></div>
              <div class="collapsible__toggle-wrap">
                <button class="collapsible__toggle j-parameters-btn j-wba-card-item j-wba-card-item-show" id="automatemp__card__table__button"
                  data-name-for-wba="Item_Parameters_More"
                  data-link="text{:isCollapsed ? collapsedMsg : unCollapsedMsg}class{merge: !isCollapsed &amp;&amp; !unCollapsedMsg toggle=&quot;hide&quot;}{on toggleCollapse !isCollapsed}"
                  type="button" data-jsv="#554^/554^">Развернуть юнит экономику</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `)
    })
  }
  waitForElm('#automatemp__card__table__button').then((elm) => {
    elm.addEventListener('click', function () {
      let table = document.querySelector('#automatemp__collapsible__gradient');
      if (table.classList.contains('hide')) {//Если блок открыт
        table.classList.remove('hide')//Удаляем скрытие градиента
        document.querySelector("#automatemp__collapsable").style.maxHeight = '224px';//Обрубаем блок по высоте
        elm.textContent = 'Развернуть юнит экономику'
      } else {
        table.classList.add('hide')
        document.querySelector("#automatemp__collapsable").style.maxHeight = 'none';//Раскрываем блок по высоте
        elm.textContent = 'Свернуть юнит экономику'
      }
    });
  })

  waitForElm('.automatemp__unitEconom__select-unit').then((elm) => {
    var selectString = '';
    wareHouses.forEach((item, index) => {
      if (index === 0) {
        selectString += `<option value="${item.id}" selected>${item.name}</option>`;
      } else {
        selectString += `<option value="${item.id}">${item.name}</option>`;
      }
    });
    [...document.getElementsByClassName('automatemp__unitEconom__select-unit')].forEach(elem => {
      elem.insertAdjacentHTML('beforeend', selectString);
    });

    [...document.getElementsByClassName('automatemp__unitEconom__select-unit')].forEach(elem => {
      elem.addEventListener('change', e => {
        var prodId;
        waitForElm('#productNmId').then((elm) => {
          prodId = document.getElementById('productNmId').innerText;
          chrome.runtime.sendMessage({ command: 'logistic', article_id: prodId, warehouse_id: e.target.value }, (response) => { })
        })
      })
    });
  })

  waitForElm('.automatemp__unitEconom-calcForm').then(elm => {
    elm.addEventListener('submit', function (event) {
      event.preventDefault(); // Предотвращаем отправку формы
      let elm = document.querySelector('.automatemp__unitEconom-calcForm__table')
      if (elm) {
        console.log(elm);
        elm.remove()
      }
      fillUnitCalc()
    });
  })

  function fillUnitCalc() {
    const deliveryTypeSelect = document.querySelector('.automatemp__unitEconom__select-delivery_type');
    const deliveryTypeOptions = Array.from(deliveryTypeSelect.selectedOptions, option => option.value);

    const warehouseSelect = document.querySelector('#automatemp__unitEconom__select');
    const warehouseOptions = Array.from(warehouseSelect.selectedOptions, option => option.value);

    var input1 = document.getElementById('automatemp__unitEconom-input__purchase_price').value;
    var input2 = document.getElementById('automatemp__unitEconom-input__additional').value;
    var input3 = document.getElementById('automatemp__unitEconom-input__logistic_to_mp').value;
    var input4 = document.getElementById('automatemp__unitEconom-input__wrap_days').value;
    var input5 = document.getElementById('automatemp__unitEconom-input__redemtion_percent').value;
    var input6 = document.getElementById('automatemp__unitEconom-input__merriage_percent').value;
    var input7 = document.getElementById('automatemp__unitEconom-input__tax_rate').value;
    var input8 = document.getElementById('automatemp__unitEconom-input__profit_target').value;

    // Формируем данные для отправки на сервер
    var data = {
      delivery_type: deliveryTypeOptions[0],
      warehouse_id: parseInt(warehouseOptions[0]),
      purchase_price: parseFloat(input1),
      additional: parseFloat(input2),
      logistic_to_mp: parseFloat(input3),
      wrap_days: parseInt(input4),
      redemtion_percent: parseInt(input5),
      merriage_percent: parseInt(input6),
      tax_rate: parseInt(input7),
      profit_target: parseInt(input8),
    };

    let prodId = document.getElementById('productNmId').innerText;

    chrome.runtime.sendMessage({ command: 'unitCalculateRequest', id: prodId, data: data }, (response) => {
      if (response.length != 0) {
        document.querySelector(".automatemp__unitEconom-calcForm").insertAdjacentHTML('afterend', `
          <table class="product-params__table automatemp__unitEconom-calcForm__table">
            <caption data-jsv="#346^#159_" class="product-params__caption">Результаты</caption>
            <tbody data-jsv="/159_/346^" data-jsv-df="">
              <tr data-jsv="#395^#160_#161_" class="product-params__row">
                <th class="product-params__cell">
                  <span class="product-params__cell-decor">
                    <span>Маржинальность</span>
                  </span>
                </th>
                <td class="product-params__cell">
                  <span id="unitSpan__result-margin">${response.margin_percent} % - ${response.margin} ₽</span>
                </td>
              </tr>
              <tr data-jsv="#395^#160_#161_" class="product-params__row">
                <th class="product-params__cell">
                  <span class="product-params__cell-decor">
                    <span>Рентабельность</span>
                  </span>
                </th>
                <td class="product-params__cell">
                  <span id="unitSpan__result-profitability">${response.profitability} %</span>
                </td>
              </tr>
              <tr data-jsv="#395^#160_#161_" class="product-params__row">
                <th class="product-params__cell">
                  <span class="product-params__cell-decor">
                    <span>Для достижения цели нужно продать</span>
                  </span>
                </th>
                <td class="product-params__cell">
                  <span id="unitSpan__result-profitTarget">${response.profit_target.quantity} шт. 
                  (в день ${response.profit_target.day_quantity} шт.)</span>
                </td>
              </tr>                    
            </tbody>
          </table>
        `)
      }
    });
  }


}

function rewriteLogistic() {//Перезапись логистики в юнит экономике
  waitForElm('.automatemp__logistic__table').then((elm) => {
    document.getElementById('automatemp__logistic__table__amount').innerHTML = `${logistic.logistic_amount} ₽`
    document.getElementById('automatemp__logistic__table__from_client').innerHTML = `${logistic.from_client} ₽`
    document.getElementById('automatemp__logistic__table__storage_amount').innerHTML = `${logistic.storage_amount} ₽ в день`
    document.getElementById('automatemp__logistic__table__reception').innerHTML = `${logistic.reception_amount > 0 ? `x${logistic.reception_amount}` : logistic.reception_amount === 0 ? 'бесплатно' : 'недоступно'}`
  })
}

function fillCardPage() {//Блок с рекламными ставками промотовара
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
    waitForElm('#automatempBlock__card__list').then((elm) => {
      cpmData.forEach((item, index) => {
        elm.insertAdjacentHTML('beforeend', `
          <li class="automatempBlock__card__list__item">${index + 1} - ${new Intl.NumberFormat('ru-RU').format(item.cpm)} ₽</li>
        `)
      });
    })
  }
}

function fillCertificate() {//Заполнение сертификата товара
  if (document.querySelectorAll('#automatempSertif').length === 0) document.querySelector('.certificate-check').insertAdjacentHTML('beforeend', `
    <div class="automatempSertif" id="automatempSertif">
      <button class="btn-base">Заказать сертификацию</button>
      <div class="automatempSertif__btn__img__block" id="automatempSertif__btn__img__block">
        <button class="automatempSertif__mini__btn automatempSertif__info__btn" id="automatempSertif__info__btn">
        </button>
        <a class="automatempSertif__mini__btn automatempSertif__rosgossert__btn" href="" target="_blank">
        </a> 
      </div>
    </div>       
  
  `);
  if (document.querySelectorAll('#automatemp-modalCert').length === 0) {
    document.getElementsByTagName('body')[0].insertAdjacentHTML('AfterBegin',
      `<div id="automatemp-modalCert" class="automatemp-modalCert">
      <div class="automatemp-modalCert_content">
        <span id="automatemp_CertClose">&times;</span>
        <div class="automatemp-modalCert__title__box">
          <a class="automatempBlock__logo__link" href="https://automate-mp.ru/">
            <img class="automatempBlock__logo1" src="https://static.tildacdn.com/tild3039-6432-4739-b839-313265366638/d2d4e200-dc87-4d6c-a.svg"/>
            <div class="automatemp-modalCert--title">Проверка сертификата / декларации</div>
          </a>
        </div>
        
        <ul class="automatemp-modalCert--content"></ul>
      </div>
    </div>`
    );
    document.getElementById('automatempSertif__info__btn').addEventListener('click', function () {
      document.getElementsByClassName('automatemp-modalCert--content')[0].innerHTML = '';
      modalVisible();
      document.getElementsByClassName('automatemp-modalCert--content')[0].insertAdjacentHTML('afterbegin', '<span class="loaderCert-automatemp" style="display:block;"></span>');
      let prodId = document.getElementById('productNmId').innerText;
      chrome.runtime.sendMessage({ command: 'certificate', id: prodId }, (response) => {
        if (response.have_sertificate == null) {
          document.getElementById('automatempSertif').style.display = 'none'
          document.getElementById('automatemp-modalCert').style.display = 'none'
        }
        if (response.length !== 0) {
          document.querySelector('.loaderCert-automatemp').style.display = 'none';
          var content = document.querySelector('.automatemp-modalCert--content');
          if (!response.results.applicant || response.results.applicant === '') content.innerText = 'Нет данных';
          var result = [];
          for (const property in response.results) {
            result.push({ property: property, value: response.results[property] })
          }
          result.forEach(item => {
            var name;
            switch (item.property) {
              case 'decl_number':
                name = 'Номер декларации';
                break;
              case 'declRegDate':
                name = 'Дата регистрации декларации';
                break;
              case 'declEndDate':
                name = 'Дата окончания декларации';
                break;
              case 'fullName':
                name = 'Полное наименование';
                break;
              case 'applicant':
                name = 'Заявитель';
                break;
              case 'applicant_ogrn':
                name = 'ОГРН заявителя';
                break;
              case 'applicant_inn':
                name = 'ИНН заявителя';
                break;
              case 'applicant_email':
                name = 'Email заявителя';
                break;
              case 'applicant_phone':
                name = 'Телефон заявителя';
                break;
              case 'applicant_address':
                name = 'Адрес заявителя';
                break;
              case 'manufacturer':
                name = 'Изготовитель';
                break;
              case 'manufacturer_address':
                name = 'Адрес изготовителя';
                break;
              case 'testing_number':
                name = 'Номер тестирования';
                break;
              case 'testing_lab_name':
                name = 'Лаборатория тестирования';
                break;
              case 'testing_lab_address':
                name = 'Адрес лаборатории тестирования';
                break;
              case 'protocol_date':
                name = 'Дата протокола';
                break;
              case 'protocol_number':
                name = 'Номер протокола';
                break;
              case 'basis':
                name = 'Основание';
                break;
            }
            if (item.value === null || item.value === 'null' || item.value === '') item.value = 'нет данных';
            content.insertAdjacentHTML('beforeend', `<li><span class="text">${name}</span><span class="page">${item.value}</span></li>`)
          })

          content.insertAdjacentHTML('beforeend', `<button class="btn-base automatemp-modalCert__btn-base" > Заказать сертификацию</button>`)

          document.addEventListener('click', clickOutsidePopUp);
        }
      })

      document.getElementById('automatemp_CertClose').addEventListener('click', function () {
        modalOut();
      })


    })
  }


  let prodId = document.getElementById('productNmId').innerText;
  chrome.runtime.sendMessage({ command: 'rosgoscert', id: prodId }, (response) => {
    if (response) {
      waitForElm('.automatempSertif__rosgossert__btn').then((elm2) => {
        elm2.href = response
        elm2.target = "_blank"
      })
    } else {
      waitForElm('.automatempSertif__rosgossert__btn').then((elm2) => {
        elm2.href = "javascript: void(0)"
        elm2.removeAttribute("target")
      })
    }
  })

}

function modalVisible() {//Открывает модальное окно сертификата
  document.getElementById('automatemp-modalCert').style.display = 'block';
}

function modalOut() {//Закрывает модальное окно сертификата
  document.getElementById('automatemp-modalCert').style.display = 'none';
  document.removeEventListener('click', clickOutsidePopUp);
}

function clickOutsidePopUp(event) {//Проверка на клик вне модального окла сертификата
  const modal = document.querySelector('.automatemp-modalCert_content');
  const isClickInsideModal = modal.contains(event.target);
  if (!isClickInsideModal) {
    modalOut()
  }
}

function fillReleaseData(elm) {//Вывод даты появления товара
  let prodId = document.getElementById('productNmId').innerText;
  chrome.runtime.sendMessage({ command: 'releaseDate', id: prodId }, (response) => {
    if (response.length != 0) {
      date = new Date(response);
      let formattedDate = `${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
      elm.insertAdjacentHTML('afterend', `
        <p class="automatemp__releaseDate" id="automatemp__releaseDate">Дата появления: ${formattedDate}</p>
      `)
    }
  });
}

function fillWarehouses(updatePage) {//Блок со складами на странице товара
  //Проверка на то, что блока со складами на странице нет. Если проверка прошла, то создаем этот блок
  if (document.querySelectorAll('#warehousesBlock').length == 0) {
    document.querySelector('.product-page__aside-container').insertAdjacentHTML('beforeend', `
      <div id="warehousesBlock">
        <details class="automatemp__warehouses-details automatemp__warehouses-details__warehouses">
          <summary class="automatemp__warehouses-summary">Склады</summary>
          <div class="automatemp__warehouses-wrapper">
            <div class="automatemp__warehouses-radio">
              <input label="По складам" type="radio" id="automatemp__warehouses-warehouse" name="warehouse-size" value="warehouse" checked>
              <input label="По размерам" type="radio" id="automatemp__warehouses-size" name="warehouse-size" value="size">
            </div>
          </div>
        </details>
        <details class="automatemp__warehouses-details">
          <summary class="automatemp__warehouses-summary">В избранное</summary>
          <div class="automatemp__warehouses-wrapper">
            <input class="automatemp__warehouses-input" type="text", id="automatemp__warehouses-input__favorites" placeholder="Поисковый запрос"/>
            <div class="automatemp__warehouses-content__box">
              <form>
                <div class="__select __select1" data-state="">
                  <div class="__select__title __select__title1" data-default="3 часа">3 часа</div>
                  <div class="__select__content __select__content1">
                    <input id="favorities-1" class="__select__input" type="radio" name="favoritiesSelect" />
                    <label for="favorities-1" class="__select__label __select__label1">3 часа</label>
                    <input id="favorities0" class="__select__input" type="radio" name="favoritiesSelect" checked />
                    <label for="favorities0" class="__select__label __select__label1">3 часа</label>
                    <input id="favorities1" class="__select__input" type="radio" name="favoritiesSelect" />
                    <label for="favorities1" class="__select__label __select__label1">12 часов</label>             
                    <input id="favorities2" class="__select__input" type="radio" name="favoritiesSelect" />
                    <label for="favorities2" class="__select__label __select__label1">1 день</label>             
                    <input id="favorities3" class="__select__input" type="radio" name="favoritiesSelect" />
                    <label for="favorities3" class="__select__label __select__label1">3 дня</label>             
                    <input id="favorities4" class="__select__input" type="radio" name="favoritiesSelect" />
                    <label for="favorities4" class="__select__label __select__label1">7 дней</label>             
                    <input id="favorities5" class="__select__input" type="radio" name="favoritiesSelect" />
                    <label for="favorities5" class="__select__label __select__label1">14 дней</label>             
                  </div>
                </div>
              </form>         
              <div class="number-input">
                <button onclick="this.parentNode.querySelector('input[type=number]').stepDown()"></button>
                <input class="quantity" min="0" name="quantity" value="0" type="number">
                <button onclick="this.parentNode.querySelector('input[type=number]').stepUp()"></button>
              </div>
            </div>
            <button class="btn-base automatemp__warehouses-order_btn">Заказать</button>                        
          </div>
        </details>
        <details class="automatemp__warehouses-details automatemp__warehouses-details__last">
          <summary class="automatemp__warehouses-summary ">В корзину</summary>
          <div class="automatemp__warehouses-wrapper">
            <input class="automatemp__warehouses-input" type="text", id="automatemp__warehouses-input__favorites" placeholder="Поисковый запрос"/>
            <div class="automatemp__warehouses-content__box">
              <form>
                <div class="__select __select2" data-state="">
                  <div class="__select__title __select__title2" data-default="3 часа">3 часа</div>
                  <div class="__select__content __select__content2">
                    <input id="backet-1" class="__select__input" type="radio" name="backetSelect" />
                    <label for="backet-1" class="__select__label __select__label2">3 часа</label>
                    <input id="backet0" class="__select__input" type="radio" name="favoritiesSelect" checked />
                    <label for="backet0" class="__select__label __select__label2">3 часа</label>
                    <input id="backet1" class="__select__input" type="radio" name="favoritiesSelect" />
                    <label for="backet1" class="__select__label __select__label2">12 часов</label>             
                    <input id="backet2" class="__select__input" type="radio" name="favoritiesSelect" />
                    <label for="backet2" class="__select__label __select__label2">1 день</label>             
                    <input id="backet3" class="__select__input" type="radio" name="favoritiesSelect" />
                    <label for="backet3" class="__select__label __select__label2">3 дня</label>             
                    <input id="backet4" class="__select__input" type="radio" name="favoritiesSelect" />
                    <label for="backet4" class="__select__label __select__label2">7 дней</label>             
                    <input id="backet5" class="__select__input" type="radio" name="favoritiesSelect" />
                    <label for="backet5" class="__select__label __select__label2">14 дней</label>             
                  </div>
                </div>
              </form>                 
              <div class="number-input">
                <button onclick="this.parentNode.querySelector('input[type=number]').stepDown()"></button>
                <input class="quantity" min="0" name="quantity" value="0" type="number">
                <button onclick="this.parentNode.querySelector('input[type=number]').stepUp()"></button>
              </div>
            </div>
            <button class="btn-base automatemp__warehouses-order_btn">Заказать</button>                        
          </div>
        </details>
      </div>      
    `)

    function updateWarehouses(update) { //Обновление данных складов, избранного и корзины. Нужно при изменении ширины страницы
      const selectSingle1 = document.querySelector('.__select1');
      const selectSingle_title1 = selectSingle1.querySelector('.__select__title1');
      const selectSingle_labels1 = selectSingle1.querySelectorAll('.__select__label1');
      // Toggle menu
      selectSingle_title1.addEventListener('click', () => {
        if ('active' === selectSingle1.getAttribute('data-state')) {
          selectSingle1.setAttribute('data-state', '');
        } else {
          selectSingle1.setAttribute('data-state', 'active');
        }
      });
      // Close when click to option
      for (let i = 0; i < selectSingle_labels1.length; i++) {
        selectSingle_labels1[i].addEventListener('click', (evt) => {
          selectSingle_title1.textContent = evt.target.textContent;
          selectSingle1.setAttribute('data-state', '');
        });
      }

      const selectSingle2 = document.querySelector('.__select2');
      const selectSingle_title2 = selectSingle2.querySelector('.__select__title2');
      const selectSingle_labels2 = selectSingle2.querySelectorAll('.__select__label2');
      // Toggle menu
      selectSingle_title2.addEventListener('click', () => {
        if ('active' === selectSingle2.getAttribute('data-state')) {
          selectSingle2.setAttribute('data-state', '');
        } else {
          selectSingle2.setAttribute('data-state', 'active');
        }
      });
      // Close when click to option
      for (let i = 0; i < selectSingle_labels2.length; i++) {
        selectSingle_labels2[i].addEventListener('click', (evt) => {
          selectSingle_title2.textContent = evt.target.textContent;
          selectSingle2.setAttribute('data-state', '');
        });
      }

      function fillWarehousesWarehouses() {
        if (document.querySelector('.automatemp__warehouses-table')) {// Очищаем оставшуюся таблицу, если была
          let el = document.querySelector('.automatemp__warehouses-table');
          el.parentNode.removeChild(el)
        }
        if (document.getElementById('automatemp__warehouses-warehouse').checked) {
          chrome.runtime.sendMessage({ command: 'warehouses-warehouse', id: prodId }, (response) => {
            //Если результат запроса не пустой, отрисовываем основу таблицы
            if (response.length != 0) {
              document.querySelector('.automatemp__warehouses-wrapper').insertAdjacentHTML('beforeend', `
              <table class="automatemp__warehouses-table">
                <tbody class="automatemp__warehouses-table__tbody">
                </tbody>
              </table>
            `)
              //Находим основу таблицы и заполняем ее данными из результата запроса
              let elm = document.querySelector('.automatemp__warehouses-table__tbody');
              response.forEach(item => {
                elm.insertAdjacentHTML('beforeend', `
                <tr>
                  <td class="automatemp__warehouses-table__tbody-td automatemp__warehouses-table__tbody-td--regular">${item.warehouse_name}</td>
                  <td class="automatemp__warehouses-table__tbody-td automatemp__warehouses-table__tbody-td--bold">${item.percent}%</td>
                  <td class="automatemp__warehouses-table__tbody-td automatemp__warehouses-table__tbody-td--lite">${item.qty} шт.</td>
                </tr>
              `)
              })
            }
          });
        }
      }

      let prodId = document.getElementById('productNmId').innerText;

      if (update) fillWarehousesWarehouses() //Когда пользователь только зайдет на страницу, у него сразу появятся склады, для размеров отдельной функции нет

      document.getElementById('automatemp__warehouses-warehouse').addEventListener('click', function () {
        //Если пользователь выбрал склады
        fillWarehousesWarehouses();
      })

      document.getElementById('automatemp__warehouses-size').addEventListener('click', function () {
        //Если пользователь выбрал размеры
        if (document.querySelector('.automatemp__warehouses-table')) {// Очищаем оставшуюся таблицу, если была
          let el = document.querySelector('.automatemp__warehouses-table');
          el.parentNode.removeChild(el)
        }
        if (document.getElementById('automatemp__warehouses-size').checked) {
          chrome.runtime.sendMessage({ command: 'warehouses-size', id: prodId }, (response) => {
            if (response.length != 0) {
              document.querySelector('.automatemp__warehouses-wrapper').insertAdjacentHTML('beforeend', `
              <table class="automatemp__warehouses-table">
                <tbody class="automatemp__warehouses-table__tbody">
                </tbody>
              </table>
            `)
            }
            let elm = document.querySelector('.automatemp__warehouses-table__tbody');
            response.forEach(item => {
              elm.insertAdjacentHTML('beforeend', `
                <tr>
                  <td class="automatemp__warehouses-table__tbody-td automatemp__warehouses-table__tbody-td--regular">${item.size}</td>
                  <td class="automatemp__warehouses-table__tbody-td automatemp__warehouses-table__tbody-td--bold">${item.warehouse_name}</td>
                  <td class="automatemp__warehouses-table__tbody-td automatemp__warehouses-table__tbody-td--lite">${item.qty} шт.</td>
                </tr>
              `)
            })
          });
        }
      })
    }

    updateWarehouses(true)
    waitForElm('#warehousesBlock').then((elm) => {
      if (window.innerWidth >= 1365.98) moveBlock('normal')
      if (this.window.innerWidth < 1365.98 && this.window.innerWidth >= 1023.98) moveBlock('medium')
      if (window.innerWidth < 1023.98) moveBlock('minimum')
    })



    // Initialize variables
    let size = '';

    // Detect window size and handle events accordingly
    window.addEventListener('resize', function () {
      if (this.window.innerWidth >= 1365.98 && size !== 'normal') {
        moveBlock('normal');
      } else if (this.window.innerWidth < 1365.98 && this.window.innerWidth >= 1023.98 && size !== 'medium') {
        moveBlock('medium');
      } else if (this.window.innerWidth < 1023.98 && size !== 'minimum') {
        moveBlock('minimum');
      }
    });

    // Move block to corresponding location based on the window size
    function moveBlock(newSize) {
      const block = document.querySelector('#warehousesBlock');
      let copy = '';

      if (newSize === 'normal') {
        copy = block.cloneNode(true);
        copy.classList.remove('resizeToMedium');
        copy.classList.remove('resizeToMinimum');
        copy.classList.add('resizeToNormal');
        document.querySelector('.product-page__aside-container').appendChild(copy);
      } else if (newSize === 'medium') {
        copy = block.cloneNode(true);
        copy.classList.remove('resizeToNormal');
        copy.classList.remove('resizeToMinimum');
        copy.classList.add('resizeToMedium');
        document.querySelector('.product-page__order').appendChild(copy);
      } else if (newSize === 'minimum') {
        copy = block.cloneNode(true);
        copy.classList.remove('resizeToNormal');
        copy.classList.remove('resizeToMedium');
        copy.classList.add('resizeToMinimum');
        const betweenBlock = document.querySelector('.product-page__delivery-advantages');
        const afterBlock = document.querySelector('.product-page__seller-wrap');
        betweenBlock.parentNode.insertBefore(copy, afterBlock);
      }

      block.parentElement.removeChild(block);
      size = newSize;
      updateWarehouses(false);
    }

    let productPageAsideContainer = document.querySelector('.product-page__aside-container')
    let priceBlock = productPageAsideContainer.querySelector('.price-block__price-wrap')

    productPageAsideContainer.insertAdjacentHTML('afterbegin', `
      <div class="automatemp__changePrice " style="display:none;">
        <div class="automatempBlock__logoButton ">
          <a class="automatempBlock__logo__link " href="https://automate-mp.ru/">
            <img class="automatempBlock__logo1 " src="https://static.tildacdn.com/tild3039-6432-4739-b839-313265366638/d2d4e200-dc87-4d6c-a.svg"/>
            <img class="automatempBlock__logo2 " src="https://static.tildacdn.com/tild3436-3731-4466-b732-646465616236/1401a47a-25ef-4d45-b.svg"/>
          </a>
          <div class="automatemp__changePrice-close ">x<div>
        </div>
        <div class="automatemp__changePrice-content ">
          
        </div>
      </div>
    `)
    priceBlock.addEventListener('click', function () {//При клике на цену все элементы в блоке со складами станоятся невидимыми
      asideContainerChange('close')
    })
    document.querySelector('.automatemp__changePrice-close').addEventListener('click', function () {
      asideContainerChange('open')
    })

    function asideContainerChange(what) {
      if (what == 'close') {
        document.querySelector('.product-page__price-block.product-page__price-block--aside').style.display = 'none'
        document.querySelectorAll('.order-to-poned')[1].style.display = 'none'
        document.querySelector('.product-page__aside-container .order').style.display = 'none'
        document.querySelector('.product-page__aside-container .product-page__delivery').style.display = 'none'
        document.querySelector('.product-page__aside-container #warehousesBlock').style.display = 'none'
        document.querySelector('.automatemp__changePrice').style.display = 'block'
      } else {
        document.querySelector('.product-page__price-block.product-page__price-block--aside').style.display = 'block'
        document.querySelectorAll('.order-to-poned')[1].style.display = 'block'
        document.querySelector('.product-page__aside-container .order').style.display = 'flex'
        document.querySelector('.product-page__aside-container .product-page__delivery').style.display = 'block'
        document.querySelector('.product-page__aside-container #warehousesBlock').style.display = 'block'
        document.querySelector('.automatemp__changePrice').style.display = 'none'
      }
    }

  }
}

function fillPromos(wheel) {//Отрисовка цены на карточках промотоваров. Плохо работает после обновлений
  var cards = [...document.getElementsByClassName('product-card__main j-card-link')];
  if (wheel && cards.length > 10) {
    cards = [...document.getElementsByClassName('product-card__main j-card-link')].splice(cards.length - 10);
  }
  if (promos.length != 0) {
    promos.adverts.forEach(code => {
      var foundPromo = cards.find(card => { if (card.attributes[2].value.includes(`/${code.id}/`)) return true });
      if (foundPromo && !foundPromo.querySelector('.automatempBlock__promo__card')) {
        foundPromo.children[0].classList.add('automatempBlock__promo__card__img')
        let el = foundPromo.querySelector('.product-card__tip--promo')
        el.innerHTML = `Промотовар - ${new Intl.NumberFormat('ru-RU').format(code.cpm)} ₽`;
      }
    })
  }
}

function fillAddQuestion(elm) {//Модальное окно с добавлением отзыва
  elm.insertAdjacentHTML('beforeend', `
    <details class="automatemp__warehouses-details automatemp__warehouses-details__warehouses searchModal__detail searchModal__detail-addQuestion">
      <summary class="automatemp__warehouses-summary searchModal__summary">
        <img class="automatempBlock__logo1" src="https://static.tildacdn.com/tild3039-6432-4739-b839-313265366638/d2d4e200-dc87-4d6c-a.svg"/>
        <h2 class="searchModal__summary-title">Добавить вопрос</h2>
      </summary>
      ${searchModal('productQuestions')}
    </details>
  `)

  // updateWarehouses(true)
  waitForElm('.searchModal__detail-addQuestion').then((elm) => {
    if (window.innerWidth >= 1023.98) moveBlock('normal')
    if (window.innerWidth < 1023.98) moveBlock('minimum')
  })

  // Initialize variables
  let size = '';

  // Detect window size and handle events accordingly
  window.addEventListener('resize', function () {
    if (this.window.innerWidth >= 1023.98 && size !== 'normal') {
      moveBlock('normal');
    } else if (this.window.innerWidth < 1023.98 && size !== 'minimum') {
      moveBlock('minimum');
    }
  });

  // Move block to corresponding location based on the window size
  function moveBlock(newSize) {
    const block = document.querySelector('.searchModal__detail-addQuestion');
    let copy = '';

    if (newSize === 'normal') {
      copy = block.cloneNode(true);
      copy.classList.remove('resizeToMinimum');
      copy.classList.add('resizeToNormal');
      document.querySelector('.user-activity__tabs').insertAdjacentElement('beforeend', copy)
    } else if (newSize === 'minimum') {
      copy = block.cloneNode(true);
      copy.classList.remove('resizeToNormal');
      copy.classList.add('resizeToMinimum');
      const editor = document.querySelector('.user-activity__tabs-wrap');
      editor.insertAdjacentElement('afterend', copy);
    }

    block.parentElement.removeChild(block);
    size = newSize;
    // updateWarehouses(false);
  }
}

function fillCardPageMainImg(elm) {
  elm.insertAdjacentHTML('beforebegin', `
    <a class="mix-block__find-similar j-wba-card-item j-find-similar automatemp__cardpage-mainImg__download-btn" id="automatemp__cardpage-mainImg__download-btn">
      <span></span>
    </a>
  `)
  let prodId = document.getElementById('productNmId').innerText;
  document.querySelector('.automatemp__cardpage-mainImg__download-btn').addEventListener('click', function (evt) {
    evt.preventDefault()
    console.log(prodId);
    chrome.runtime.sendMessage({ command: 'downloadImages', id: prodId }, (response) => {
    })
  })
}

//==================================
//Страница отзывов------------------
//==================================

function fillFeedbacks() {//Калькулятор оценок в отзывах
  if (feedbacks.length != 0) {

    function feedbackCalcFunc() {
      feedbacks.forEach((item) => {
        if (item.reviews_count != 0) {
          waitForElm('.automatemp__feedbacks-calc__inner').then((elm) => {
            elm.insertAdjacentHTML('beforeend', `
              <div class="automatemp__feedbacks-calc__ratebox">
                <div class="automatemp__feedbacks-calc__ratebox-titlebox rating-product">
                  <div class="rating-product__header">
                    <div class="rating-product__all-rating">
                      <b class="rating-product__numb">${item.rate}</b>
                      <span class="rating-product__all-stars stars-line star${item.rate}"></span>
                    </div>
                    <p class="rating-product__review hide-mobile">
                      ${item.reviews_count} ${declOfNum(item.reviews_count, ['отзыв', 'отзыва', 'отзывов'])}
                    </p>
                  </div>

                  <div class="automatemp__feedbacks-calc__ratebox-items" id="automatemp__star${item.rate}">

                  </div>
                </div>  
              </div>
            `)
          })

          waitForElm('#automatemp__star' + item.rate).then((elm) => {
            item.ratings.forEach((item1) => {
              elm.insertAdjacentHTML('beforeend', `
                <div class="automatemp__feedbacks-calc__ratebox-item">
                  <h6 class="automatemp__feedbacks-calc__ratebox-item__rating">${item1.rate.toFixed(1)}</h6>
                  <p class="automatemp__feedbacks-calc__ratebox-item__ratingCount">${item1.reviews_count} ${declOfNum(item1.reviews_count, ['отзыв', 'отзыва', 'отзывов'])}</p>
                </div>
              `)
            })
          })
        }
      })
    }

    feedbackCalcFunc()

    waitForElm('.product-feedbacks__side').then((elm) => {
      elm.insertAdjacentHTML('beforeend', `
        <div class="automatemp__feedbacks" id="automatemp__feedbacks">
          <button class="btn-base btn-base--lg rating-product__btn hide-mobile automatemp__feedbacks-btn" type="button">
            <a class="automatemp__feedbacks-btn__link" href="https://automate-mp.ru/" target="_blank">
              <div class="automatemp__feedbacks-btn__link-box">
                <div class="automatemp__feedbacks-btn__link-box__logo-box">
                  <img class="automatemp__feedbacks-btn__link-box__logo" src="https://static.tildacdn.com/tild3039-6432-4739-b839-313265366638/d2d4e200-dc87-4d6c-a.svg">
                </div>        
                <div class="automatemp__feedbacks-btn__link-box__content">
                  <div class="automatemp__feedbacks-btn__link-box__title-box">
                    <img class="automatemp__feedbacks-btn__link-box__title" src="https://static.tildacdn.com/tild3436-3731-4466-b732-646465616236/1401a47a-25ef-4d45-b.svg">
                  </div>
                  <p class="automatemp__feedbacks-btn__link-box__descr">Заказать отзывы по 1 руб</p>
                </div>        
              </div>
            </a>
          </button>

          <div class="automatemp__feedbacks-calc product-feedbacks">
            <div class="automatemp__feedbacks-calc__inner">
              <h3 class="automatemp__feedbacks-calc__title">Калькулятор</h3>
            </div>
          </div>
          
        </div>
      `)
    })

    waitForElm('.product-feedbacks__main').then((elm) => {
      const newDiv = document.createElement('div');
      newDiv.classList.add('automatemp__feedbacks--adaptive')
      newDiv.insertAdjacentHTML('beforeend', `
        <details class="automatemp__feedbacks-calc__details">
          <summary>Калькулятор</summary>
          <div class="automatemp__feedbacks-calc product-feedbacks automatemp__feedbacks-calc--adaptive">
            <div class="automatemp__feedbacks-calc__inner--adaptive">
              
            </div>
          </div>
        </details>
      `)
      let checkPhoto = document.getElementsByClassName('product-feedbacks__user-photos');
      if (checkPhoto) {
        elm.insertBefore(newDiv, elm.children[3]);
      } else {
        elm.insertBefore(newDiv, elm.children[2]);
      }
    })


    feedbacks.forEach((item) => {
      if (item.reviews_count != 0) {
        waitForElm('.automatemp__feedbacks-calc__inner--adaptive').then((elm) => {
          elm.insertAdjacentHTML('beforeend', `
              <div class="automatemp__feedbacks-calc__ratebox">
                <div class="automatemp__feedbacks-calc__ratebox-titlebox rating-product">
                  <div class="rating-product__header">
                    <div class="rating-product__all-rating">
                      <b class="rating-product__numb">${item.rate}</b>
                      <span class="rating-product__all-stars stars-line star${item.rate}"></span>
                    </div>
                    <p class="rating-product__review hide-mobile">
                      ${item.reviews_count} ${declOfNum(item.reviews_count, ['отзыв', 'отзыва', 'отзывов'])}
                    </p>
                  </div>

                  <div class="automatemp__feedbacks-calc__ratebox-items" id="automatemp__star${item.rate}--adaptive">

                  </div>
                </div>  
              </div>
            `)
        })

        waitForElm('#automatemp__star' + item.rate + '--adaptive').then((elm) => {
          item.ratings.forEach((item1) => {
            elm.insertAdjacentHTML('beforeend', `
                <div class="automatemp__feedbacks-calc__ratebox-item">
                  <h6 class="automatemp__feedbacks-calc__ratebox-item__rating">${item1.rate.toFixed(1)}</h6>
                  <p class="automatemp__feedbacks-calc__ratebox-item__ratingCount">${item1.reviews_count} ${declOfNum(item1.reviews_count, ['отзыв', 'отзыва', 'отзывов'])}</p>
                </div>
              `)
          })
        })
      }
    })

    waitForElm('.product-page__price-history').then((elm) => {
      waitForElm('.price-history').then((elm1) => {
        elm1.addEventListener('click', function () {
          elm1.classList.toggle('dropdown-open')
        })
      })
    })

    function handleResize() {
      const windowWidth = window.innerWidth;
      if (windowWidth < 1023.98) {
        waitForElm('.automatemp__feedbacks--adaptive').then((elm) => {
          elm.style.display = 'block'
        })
        waitForElm('#automatemp__feedbacks').then((elm) => {
          elm.style.display = 'none'
        })
      } else {
        waitForElm('.automatemp__feedbacks--adaptive').then((elm) => {
          elm.style.display = 'none'
        })
        waitForElm('#automatemp__feedbacks').then((elm) => {
          elm.style.display = 'block'
        })
      }
    }
    handleResize()
    window.addEventListener('load', handleResize);
    window.addEventListener('resize', handleResize);
  }
}

//==================================
//Страница бренда-------------------
//==================================

function fillLikesOnBrand() {//Модальное окно с накруткой лайков на бренд
  waitForElm('.brand-header__like').then(elm => {
    elm.insertAdjacentHTML('afterbegin', `
      <details class="automatemp__warehouses-details automatemp__warehouses-details__warehouses searchModal__detail">
        <summary class="automatemp__warehouses-summary searchModal__summary">
          <img class="automatempBlock__logo1" src="https://static.tildacdn.com/tild3039-6432-4739-b839-313265366638/d2d4e200-dc87-4d6c-a.svg"/>
          <h2 class="searchModal__summary-title">Добавить лайки</h2>
        </summary>
        ${searchModal('brandMainLikes')}
      </details>
    `)
  })
}

//==================================
//Вспомогательные функции-----------
//==================================

function getFromSearch() {//Выборка поиского запроса клиента
  let searchTextBegin = currentUrl.search('search=');
  let searchTextEnd = currentUrl.indexOf('#', searchTextBegin);
  let searchTextEnd2 = searchTextEnd === -1 ? currentUrl.indexOf('#', searchTextBegin) : null;
  searchText = searchTextEnd2 === -1 ? currentUrl.slice(searchTextBegin + 7) : currentUrl.slice(searchTextBegin + 7, searchTextEnd);
  searchText = searchText.replaceAll('+', '%20');
  searchText = decodeURI(searchText);
  return searchText
}

function declOfNum(number, words) {//Правильный падеж слова
  return words[(number % 100 > 4 && number % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][(number % 10 < 5) ? Math.abs(number) % 10 : 5]];
}

//   // waitForElm():
//   // Код waitForElm(selector) представляет собой функцию, которая используется для ожидания загрузки элемента на странице. Функция возвращает объект обещания (Promise), который будет разрешен, когда элемент, соответствующий заданному селектору, будет найден на странице.

//   // Первая вещь, которую делает функция, это создает новый объект обещания с помощью конструктора Promise. Это означает, что функция возвращает обещание, которое будет разрешено позже, когда элемент будет найден.

//   // Затем функция проверяет, есть ли элемент на странице, соответствующий заданному селектору, с помощью метода document.querySelector(selector). Если элемент уже есть на странице, функция немедленно разрешает обещание с найденным элементом.

//   // Если элемент не найден, функция создает новый объект MutationObserver, который следит за изменениями в дереве DOM. Затем функция добавляет наблюдателя на document.body, чтобы отслеживать изменения в дереве DOM.

//   // Когда элемент, соответствующий заданному селектору, будет добавлен на страницу, функция разрешит обещание с найденным элементом и отключит наблюдателя, чтобы предотвратить дальнейшее отслеживание изменений в дереве DOM.

//   // Итак, в целом, функция waitForElm(selector) используется для ожидания загрузки элемента на странице и возвращает объект обещания, который будет разрешен, когда элемент будет найден на странице. Это может быть полезно, например, когда вы хотите выполнить какой-то код, только когда элемент на странице доступен для использования.
//   // ```
function waitForElm(selector) {//Важнейшая функция, описание выше
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

function searchModal(name) {//Заготовка для модалки с запросом
  newElm =
    `
      <div class="automatemp__warehouses-wrapper searchModal searchModal__${name}">
        <input class="automatemp__warehouses-input" type="text", id="automatemp__warehouses-input__${name}" placeholder="Поисковый запрос"/>
        <div class="automatemp__warehouses-content__box">
          <form>
            <div class="__select __select-${name}" data-state="">
              <div class="__select__title __select__title-${name}" data-default="3 часа">3 часа</div>
              <div class="__select__content __select__content-${name}">
                <input id="${name}-1" class="__select__input" type="radio" name="${name}Select" />
                <label for="${name}-1" class="__select__label __select__label-${name}">3 часа</label>
                <input id="${name}0" class="__select__input" type="radio" name="${name}Select" checked />
                <label for="${name}0" class="__select__label __select__label-${name}">3 часа</label>
                <input id="${name}1" class="__select__input" type="radio" name="${name}Select" />
                <label for="${name}1" class="__select__label __select__label-${name}">12 часов</label>
                <input id="${name}2" class="__select__input" type="radio" name="${name}Select" />
                <label for="${name}2" class="__select__label __select__label-${name}">1 день</label>
                <input id="${name}3" class="__select__input" type="radio" name="${name}Select" />
                <label for="${name}3" class="__select__label __select__label-${name}">3 дня</label>
                <input id="${name}4" class="__select__input" type="radio" name="${name}Select" />
                <label for="${name}4" class="__select__label __select__label-${name}">7 дней</label>
                <input id="${name}5" class="__select__input" type="radio" name="${name}Select" />
                <label for="${name}5" class="__select__label __select__label-${name}">14 дней</label>
              </div>
            </div>
          </form>
          <div class="number-input">
            <button onclick="this.parentNode.querySelector('input[type=number]').stepDown()"></button>
            <input class="quantity" min="0" name="quantity" value="0" type="number">
            <button onclick="this.parentNode.querySelector('input[type=number]').stepUp()"></button>
          </div>
        </div>
        <button class="btn-base automatemp__warehouses-order_btn">Заказать</button>
      </div>
    `
  waitForElm(`.searchModal__${name}`).then(elm => {
    const selectSingle = document.querySelector(`.__select-${name}`);
    const selectSingle_title = selectSingle.querySelector(`.__select__title-${name}`);
    const selectSingle_labels = selectSingle.querySelectorAll(`.__select__label-${name}`);
    // Toggle menu
    selectSingle_title.addEventListener('click', () => {
      if ('active' === selectSingle.getAttribute('data-state')) {
        selectSingle.setAttribute('data-state', '');
      } else {
        selectSingle.setAttribute('data-state', 'active');
      }
    });
    // Close when click to option
    for (let i = 0; i < selectSingle_labels.length; i++) {
      selectSingle_labels[i].addEventListener('click', (evt) => {
        selectSingle_title.textContent = evt.target.textContent;
        selectSingle.setAttribute('data-state', '');
      });
    }
  })
  return (
    newElm
  )
}

function ImgLinkSlice(nmId) {//Генерирование правильной ссылки на картинку товара WB
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

//==================================
//Очистка данных--------------------
//==================================

function clearData() {
  // Clear data based on the current URL
  const currentUrl = window.location.href;

  if (currentUrl.includes('wildberries.ru/catalog') &&
    currentUrl.includes('search.aspx')) {
    jsonSearchData = [];
    jsonSearchSpecificData = [];
    tableCardsData = [];
    commissions = [];
    wareHouses = [];
    size = [];
    priorityCategoriesData = [];
    logistic = [];

    const automatempBlock = document.getElementById('automatempBlock');
    if (automatempBlock) {
      automatempBlock.parentNode.removeChild(automatempBlock);
    }

    const countRequest = document.querySelector('.automatemp__countRequest');
    if (countRequest) {
      countRequest.remove();
    }

  } else if (currentUrl.includes('detail.aspx')) {
    cpmData = [];

    const removeElementById = (id) => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
        console.log(`Element with id "${id}" was removed`);
      } else {
        console.log(`Element with id "${id}" not found`);
      }
    };

    removeElementById('automatempBlock__card__block');
    removeElementById('autmatemp__unitEconom__block');
    removeElementById('warehousesBlock');
    removeElementById('automatemp__releaseDate');
    removeElementById('automatemp__cardpage-mainImg__download-btn');
    document.querySelector('.searchModal__detail-addQuestion').remove();

  } else if (currentUrl.includes('feedbacks')) {
    feedbacks = [];

  } else if (currentUrl.includes('brands')) {
    console.log('Removed');
    const searchModalDetail = document.querySelector('.searchModal__detail');
    if (searchModalDetail) {
      searchModalDetail.remove();
    }
  }
}

document.body.addEventListener('wheel', (event) => {
  event.wheelDeltaY < 0 ? fillPromos(true) : null;
})




// https://www.wildberries.ru/catalog/130757167/detail.aspx?targetUrl=SG

