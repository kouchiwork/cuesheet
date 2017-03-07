
// 画像ファイル定義
var IMAGES = {};
IMAGES.checkpoint = "check.jpg";
IMAGES.right = "arrow.jpg";
IMAGES.left = "arrow.jpg";
IMAGES.hint = "info.jpg";

// オリジナルデータ
var sheetData;
// 整形後データ
var arrayData;


// ロード時処理
window.onload = function () {

    // GETパラメータ取得
    var qs = GetQueryString();
    if(!qs){return true;}

    // debugだったら自分の情報を自動出力
    if (qs['debug'] == 1){
        var defUrl = "https://docs.google.com/spreadsheets/d/1Eavr0q9ijsz0ZIsI9HoK0L_6Dl5w38-W0oyiEDe00wU/edit#gid=0";
        $("#sheetUrl").val(defUrl);
        $("#loadButton").click();
    }

    // KEYが指定されている場合は自動出力
    if (qs['key']){
        var defUrl = "https://docs.google.com/spreadsheets/d/"+qs['key']+"/edit#gid=0";
        $("#sheetUrl").val(defUrl);
        $("#loadButton").click();
    }

};

// loadボタンクリックイベント
$(document).on('click', "#loadButton", function () {

    // 入力されたURLからKeyを取得
    var split = $("#sheetUrl").val().split("/");
    if (split.length < 5) {
      alert("URLが間違ってないかい？");
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
        return val[0].gs$cell.$t;
    }else{
        return " "
    }
}

// 画像ファイル指定 (指定なし対応でデフォルト値をhintに)
function getImageName(val){
    if (IMAGES[val]){
        return IMAGES[val];
    }else{
        return IMAGES["hint"];
    }

}