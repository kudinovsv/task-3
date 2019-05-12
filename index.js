// здесь будет сохраняться ссылка на функцию резолвинга промиса ожидающего клика по белой ячейке
let whiteCellClickResolver;

const tableClick = function tableClick({ target }) {
// обработчик клика по таблице. если клик был по белой ячейке, резолвит ожидающий промис
  if (target.tagName === 'TD' && target.style.backgroundColor === '' && whiteCellClickResolver) {
    whiteCellClickResolver(target);
  }
};

const waitForWhiteCellClick = function waitForWhiteCellClick() {
// промимс ожидающий клика по белой ячейке
  return new Promise((res) => { whiteCellClickResolver = res; });
};

const sleep = function sleep() {
  return new Promise(res => setTimeout(res, 500));
};

const formatTime = function formatTime(timeInMs) {
// форматирование времени выраженного в миллисекундах в формат mm:ss.SSS (SSS - миллисекунды)
  const time = new Date(timeInMs);

  function get(what, length) {
    return time[`get${what}`]().toString().padStart(length, '0');
  }

  return `${get('Minutes', 2)}:${get('Seconds', 2)}.${get('Milliseconds', 3)}`;
};

const prepareCells = function prepareCells() {
/**
 * генерация раскладки цветов для ячеек. цвет сохраняется в DOM-свойство color.
 * попутно сбрасываются отображаемые в данный момент цвета ячеек - style.backgroundColor,
 * на случай если это не первый запуск игры
 */
  const colors = ['red', '#fb00f1', '#002eff', '#ffb900', '#21dc12', '#00fbe4', '#d96612', '#7b7b7b'];
  const cells = [...Array(16).keys()]; // генерация массива с номерами ячеек: [0, 1, ..., 15]

  function extractRandomCell() {
  // извлечение случайного номера ячейки из массива cells
    const index = Math.floor(Math.random() * cells.length);
    return cells.splice(index, 1)[0];
  }

  /**
   * для кажого цвета, назначим его двум случайным ячейкам, и заодно
   * сбросим у них style.backgroundColor
   */
  colors.forEach((color) => {
    for (let i = 0; i < 2; i += 1) {
      const cell = document.getElementById(extractRandomCell());

      cell.color = color;
      cell.style.backgroundColor = '';
    }
  });
};

const game = async function game() {
// функция содержащая логику игры
  prepareCells();

  const timerLabel = document.getElementById('timer');
  const startTime = new Date();
  const timer = setInterval(() => { // запускам обновления счётчика времени
    timerLabel.textContent = formatTime(new Date() - startTime);
  }, 1);

  let successCount = 0; // количество открытых пар
  let cell1;
  while (successCount < 8) {
    // если первой ячейки нет с предыдущей итерации, ждём клика
    if (!cell1) cell1 = await waitForWhiteCellClick();
    cell1.style.backgroundColor = cell1.color;

    // ждём клика по второй ячейке
    const cell2 = await waitForWhiteCellClick();
    cell2.style.backgroundColor = cell2.color;

    if (cell1.color !== cell2.color) {
      /**
       * если цвета не совпали, подождём либо таймаута, либо нового клика по белой ячейке.
       * если первым случится таймаут, в newCell1 окажется undefined
       */
      const newCell1 = await Promise.race([waitForWhiteCellClick(), sleep()]);
      cell1.style.backgroundColor = ''; // сбрасываем цвета
      cell2.style.backgroundColor = '';
      // если в newCell1 лежит ячейка, будем использовать её как первую на следующей итерации
      cell1 = newCell1;
    } else {
      cell1 = null;
      successCount += 1;
    }
  }

  clearInterval(timer);

  /**
   * если вызывать alert без setTimeout, в хроме немного некрасиво получается:
   * на экране висит алерт со значением времени чуть большим, чем отображается на странице.
   * конечно после нажатия 'ок' на алерте, время на странице обновляется до того значения что
   * отображалось на алерте, но в целом это выглядит не супер, а небольшая задержка помогает.
   */
  setTimeout(() => alert(`Вы выиграли!\nЗатраченное время: ${timerLabel.textContent}`), 50);
};

document.getElementById('table').addEventListener('click', tableClick);
document.getElementById('button').addEventListener('click', game);
