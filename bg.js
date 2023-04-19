chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.command === 'checkEnable') {
    check('https://wbcon.ru/wp-content/uploads/2022/11/29999.png')
  }
  if (message.command === 'getRequests') {
    let arr1 = []
    let arr2 = []
    let arr3 = []
    let arr4 = []
    let arr5 = []
    fetch(
      'https://catalog-ads.wildberries.ru/api/v5/search?keyword=' +
      message.text
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.adverts !== null) {
          arr1 = data.adverts.slice(0, 10);
          arr1.forEach((item) => {
            fetch(
              'https://card.wb.ru/cards/detail?curr=rub&dest=-1257786&regions=80,64,38,4,115,83,33,68,70,69,30,86,75,40,1,66,48,110,22,31,71,114,111&spp=0&nm=' +
              item.id
            )
              .then((response1) => response1.json())
              .then((data1) => {
                let result = data1.data.products[0];
                if (!result.time1) {
                  result.time1 = '?';
                }
                if (!result.time2) {
                  result.time2 = '?';
                }
                arr2.push(result);
              });
          });
          checkFirstFetch();
          function checkFirstFetch() {
            if ((arr1.length == 10 && arr2.length == 10) || (arr1.length == arr2.length)) {
              chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                chrome.tabs.sendMessage(tabs[0].id, { jsonSearchData: arr1, jsonSearchSpecificData: arr2, msg: 'firstBlock' });
              })
            } else {
              setTimeout(checkFirstFetch, 10)
            }
          }
        } else {
        }
      });

    fetch(
      'https://4947.ru/wb_extension/api/get_data?keyword=' +
      message.text
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.error !== 'ads not found') {
          arr3 = data.cards;
          arr4 = data.priority_categories;
          arr5 = data.time_info;
        } else {
        }
      });
    fetchSecondFetch();
    function fetchSecondFetch() {
      if (arr1.length != 0 && arr2.length != 0 && arr3.length != 0) {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          chrome.tabs.sendMessage(tabs[0].id, { tableCardsData: arr3, priorityCategoriesData: arr4, timeInfoData: arr5, msg: 'secondBlock' });
        })
      } else {
        setTimeout(fetchSecondFetch, 10);
      }
    }
  }
  else if (message.command === 'cardPromoBlock') {
    let arr6 = []
    fetch(`https://carousel-ads.wildberries.ru/api/v4/carousel?nm=${message.id}`)
      .then((response => response.json()))
      .then((data) => {
        arr6 = data
      });
    fetchCardPromo();
    function fetchCardPromo() {
      if (arr6.length != 0) {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          chrome.tabs.sendMessage(tabs[0].id, { cpmData: arr6, msg: 'cardPromoBlock' });
        })
      } else {
        setTimeout(fetchCardPromo, 10);
      }
    }
  }
  else if (message.command === 'getPromos') {
    let arr7 = []
    fetch(`https://catalog-ads.wildberries.ru/api/v5/search?keyword=${message.text}`)
      .then(response => response.json())
      .then((data) => {
        arr7 = data;
      });
    fetchPromo();
    function fetchPromo() {
      if (arr7.length != 0) {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          chrome.tabs.sendMessage(tabs[0].id, { promos: arr7, msg: 'getPromos' });
        })
      } else {
        setTimeout(fetchPromo, 10);
      }
    }
  }

  else if (message.command === 'unitEconom') {
    let arr8 = []
    let arr9 = []
    let arr10 = []

    fetch(`https://4947.ru/wb_extension/api/size/${message.id}`)
      .then(response => response.json())
      .then((data) => {
        arr8 = data
      });
    fetch(`https://4947.ru/wb_extension/api/commission/${message.id}`)
      .then(response => response.json())
      .then((data) => {
        arr9 = data
      });
    fetch(`https://4947.ru/wb_extension/api/warehouse`)
      .then(response => response.json())
      .then((data) => {
        arr10 = data
      });

    fetchUnitEconom()
    function fetchUnitEconom() {
      if (arr8.length !== 0 && arr9.length !== 0 && arr10.length !== 0) {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          chrome.tabs.sendMessage(tabs[0].id, { size: arr8, commissions: arr9, wareHouses: arr10, msg: 'getUnitEconom' });
        })
      } else {
        setTimeout(fetchUnitEconom, 10);
      }
    }
  }

  else if (message.command === 'logistic') {
    let arr11 = []
    fetch(`https://4947.ru/wb_extension/api/logistic/${message.article_id}/${message.warehouse_id}`)
      .then(response => response.json())
      .then((data) => {
        arr11 = data;
      });

    fetchLogistic()
    function fetchLogistic() {
      if (arr11.length !== 0) {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          chrome.tabs.sendMessage(tabs[0].id, { logistic: arr11, msg: 'getLogistic' });
        })
      } else {
        setTimeout(fetchLogistic, 10);
      }
    }
  }

  else if (message.command === 'certificate') {
    let arr12 = [];
    fetch('http://62.109.3.23:255/put/',
      {
        method: 'POST',
        body: JSON.stringify({
          article_url: `https://www.wildberries.ru/catalog/${message.id}/detail.aspx` })
      }).then(response => response.ok ? response.text() : null)
      .then(response => {
        arr12 = response ? JSON.parse(response) : null;
      })

    fetchCertificate()
    function fetchCertificate() {
      if (arr12.length !== 0) {
        console.log(arr12);
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          chrome.tabs.sendMessage(tabs[0].id, { certificate: arr12, msg: 'getCertificate' });
        })
      } else {
        setTimeout(fetchCertificate, 10)
      }
    }
  }
  return true;
});


async function sendRequest(url) {
  await fetch(url)
    .then((response) => response.json())
    .then((response) => {
      data = JSON.parse(response);
    });
  return data;
}

async function check(url) {
  await fetch(url).then((response) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, response.status);
    })
  })
}