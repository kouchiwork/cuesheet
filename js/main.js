
// 画像ファイル定義
// アイコン名とファイル名の差異を吸収
var IMAGES = {};
IMAGES.check = "check.jpg";
IMAGES.right = "right.jpg";
IMAGES.left = "left.jpg";
IMAGES.pin = "pin.jpg";
IMAGES.t = "t.jpg";
IMAGES.y = "y.png";
IMAGES.signal = "signal.png";
IMAGES.x = "x.jpg";

// queryString
var qs;
// オリジナルデータ
var sheetData;
// 整形後データ
var arrayData;
// 時刻(計算するしないのフラグ)
var startTime;

// ロード時処理
window.onload = function () {

    // GETパラメータ取得
    qs = GetQueryString();
    if(!qs){return true;}

    // debugだったら自分の情報を自動出力
    if (qs.debug == 1){
        var defUrl = "https://docs.google.com/spreadsheets/d/1Eavr0q9ijsz0ZIsI9HoK0L_6Dl5w38-W0oyiEDe00wU/edit#gid=0";
        $("#sheetUrl").val(defUrl);
        $("#loadButton").click();
    }

    // KEYが指定されている場合はURLを生成して自動出力
    if (qs.key){
        var defUrl = "https://docs.google.com/spreadsheets/d/"+qs.key+"/edit#gid=0";
        $("#sheetUrl").val(defUrl);
        $("#loadButton").click();
    }

    // start_hourが指定されている場合は時刻の設定

    // start_hour
    // start_minute
    if (qs.start_hour){
      startTime = new Date();
      startTime.setHours(qs.start_hour);
      startTime.setMinutes(0);
      startTime.setSeconds(0);
      if (qs.start_minute){
        startTime.setMinutes(qs.start_minute);
      }
    }



};

// loadボタンクリックイベント
$(document).on('click', "#loadButton", function () {

    // 入力されたURLからKeyを取得
    var split = $("#sheetUrl").val().split("/");
    if (split.length < 5) {
      alert("Wrong URL!!!");
      return false;
    }
    var sheetKey = split[5];

    // APIのURLを生成
    var requestUrl = "https://spreadsheets.google.com/feeds/cells/" + sheetKey + "/od6/public/values?alt=json";

    // SpreadSheetからシート情報を取得して格納
    $.ajax({
        type: 'GET',
        url: requestUrl,
        dataType: 'jsonp',
        cache: false,
        success: function (data) {
            // 実データ部分を取得
            sheetData = data.feed.entry;
            // データ整形
            changeData();
            // DOMに展開
            renderForm();
            // TOPまでスクロール
            window.scrollTo(0, 0) ;
        },
        error: function () {
            alert('error');
        }
    });

});

// データ整形
function changeData(){

    // 先に最大行数と最大列数から配列の形を決定し、
    // その後セル位置から値を埋め込んでいく (空白セル対応)

    // 最終アイテムのrowを最大行数とする
    var maxRow = sheetData[sheetData.length-1].gs$cell.row;

    // ヘッダ行の最大列を列幅とする
    var maxCol = 0;
    var headers =[]
    sheetData.some(function(item){
        if (item.gs$cell.row == 2){
            return true;
        }
        maxCol = item.gs$cell.col;
        headers.push(item.gs$cell.$t);
    })

    // 配列初期化
    arrayData = [];

    // SheetDataをハッシュに展開
    for(var row = 2; row <= maxRow; row++) {
        arrayData.push([]);
        for(var col = 1; col <= maxCol; col++) {
            var val = getDataFromSheet(row,col);
            arrayData[row-2][headers[col-1]]=val;
        }
    }

}

// テンプレートに出力
function renderForm() {

    // 表示初期化
    var selector = "#result";
    $(selector).empty();

    // テンプレートを取得
    var template = _.template($("#data_template").html());

    // ハッシュ配列をテンプレートに展開
    _.each(arrayData,function(elm,i){

        // ヘッダ名と値を分けてハッシュに格納
        var template_values = {};
        Object.keys(elm).forEach(function(key) {
            template_values["header_" + key] = key;
            template_values[key] = this[key];
        }, elm);

        // 出力
        $("#result").append(template(template_values));

    });

}

// ------ private functions ----------------------------------------

//クエリストリング取得
function GetQueryString() {
    if (1 < document.location.search.length) {

        // 最初の1文字 (?記号) を除いた文字列を取得する
        var query = document.location.search.substring(1);

        // クエリの区切り記号 (&) で文字列を配列に分割する
        var parameters = query.split('&');

        var result = new Object();
        for (var i = 0; i < parameters.length; i++) {

            // パラメータ名とパラメータ値に分割する
            var element = parameters[i].split('=');
            var paramName = decodeURIComponent(element[0]);
            var paramValue = decodeURIComponent(element[1]);

            // パラメータ名をキーとして連想配列に追加する
            result[paramName] = decodeURIComponent(paramValue);
        }
        return result;
    }
    return null;
}

// 指定したセル位置の値を取得
function getDataFromSheet(row,col){
    var val = sheetData.filter(function(item, index){
        if (item.gs$cell.row == row && item.gs$cell.col == col) return true;
    });
    if (val[0]){
        return val[0].gs$cell.$t.trim();
    }else{
        return ""
    }
}

// Null to hyphen
function nullToHyphen(val){
    if(!val){
        return "-"
    }else{
        return val;
    }
}

// Null to Zero
function nullToZero(val){
    if(!val){return 0;}
    if (!isFinite(val)){return 0;}
    return Number(val);
}

// 小数点四捨五入
function floatFormat( number, n ) {
    var _pow = Math.pow( 10 , n ) ;
    return Math.round( number * _pow ) / _pow ;
}

// 積算距離の補正
function makeOdo(odo,odoPlus){
    // Number化した上で合計値を四捨五入して返す
    return floatFormat(nullToZero(odo)+nullToZero(odoPlus),1);
}

// 時刻計算
function calculateTime(time,odo,speed){

  // Start時間、積算距離、予定速度が無い場合は計算しない
  if (!time){return false;}
  if (!odo){return false;}
  if (!speed){return false;}

  // 距離補正
  odo = makeOdo(odo,$("#odoplus").val())

  // 経過分を計算
  var elaplsedMinute = odo / speed * 60;
  var calcTime = new Date();
  calcTime.setHours(time.getHours());
  calcTime.setMinutes(time.getMinutes() + elaplsedMinute);

  // hh:mm 形式で変換
  return calcTime.getHours() + ":" + ("0"+calcTime.getMinutes()).slice(-2);
}
