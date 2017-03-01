
// シート列定義
var COL = {
    NUM : 0,
    TITLE : 1,
    ICON : 2,
    STREET : 3,
    NEXT : 4,
    ODO : 5,
    SIGNAL : 6,
    CAUTION : 7,
    MEMO : 8,
};

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

// ロード時処理
window.onload = function () {

    // GETパラメータ取得 (debugだったら自動出力)
    var q = GetQueryString();
    if(!q){return true;}
    if (q['debug'] != 1){ return true;}

    //デフォルトのURLを挿入
    var defUrl = "https://docs.google.com/spreadsheets/d/1Eavr0q9ijsz0ZIsI9HoK0L_6Dl5w38-W0oyiEDe00wU/edit#gid=0";
    $("#sheetUrl").val(defUrl);
    $("#loadButton").click();
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

// データを多次元配列化
function changeData() {
    arrayData = [];
    for (var i = 0; i < sheetData.length; i++) {
        var col = sheetData[i].gs$cell.col;
        var row = sheetData[i].gs$cell.row;
        var val = sheetData[i].gs$cell.$t;
        if (col == 1) {
            arrayData.push([]);
            arrayData[row - 1] = [];
        }
        arrayData[row - 1].push(val);
    }
}

// 出力
function renderForm() {

    // TODO 空行対策考える

    // 表示初期化
    var selector = "#result";
    $(selector).empty();

    for (var row = 0; row < arrayData.length; row++) {
        // ヘッダ行は表示しない
        if (row==0){ continue; }

        var rowData = arrayData[row];
        var addHtml = "";

        addHtml +="<tbody>";
        addHtml +="<tr class='tr_0'><td colspan='3'></td></tr>";

        // ------------------------------
        // 1行目
        addHtml +="<tr class='tr_1'>";

        //アイコン列
        addHtml +="<td rowspan='2' class='"+arrayData[0][COL.ICON]+" "+rowData[COL.ICON]+"'>";
        addHtml +="<img src='img/"+IMAGES[rowData[COL.ICON]]+"' >";
        addHtml +="</td>";

        //距離列
        addHtml +="<td class='"+arrayData[0][COL.ODO]+"'>";
        addHtml +="<p><span class='bignum'>" + rowData[COL.ODO]+"</span> km</p>";
        if (rowData[COL.SIGNAL] == "TRUE"){
          addHtml +="<span class='signal'><img src='img/signal.png' height='10px' /></span>";
        }
        addHtml +="</td>"
        //タイトル
        addHtml +="<td class='"+arrayData[0][COL.TITLE]+"'>";
        addHtml += rowData[COL.TITLE];
        addHtml +="</td>";

        addHtml +="</tr>";

        // ------------------------------
        // 2行目
        addHtml +="<tr class='tr_2'>";

        //次のポイントまでの距離
        addHtml +="<td class='"+arrayData[0][COL.NEXT]+"'>><span class='bignum'>" + rowData[COL.NEXT]+"</span>km</td>"
        //道路名
        addHtml +="<td class='"+arrayData[0][COL.STREET]+"'>" + rowData[COL.STREET]+"</td>"

        addHtml +="</tr>";

        // ------------------------------
        // 3行目
        addHtml +="<tr class='tr_3'>";

        var caution="";
        if (rowData[COL.CAUTION]=="TRUE"){
          caution=" caution ";
        }

        // メモ
        addHtml +="<td colspan='3' class='" + caution +arrayData[0][COL.MEMO]+"'>" + rowData[COL.MEMO].replace(/\r?\n/g, '<br>')+"</td>"
        addHtml +="</tr>";

        addHtml +="</tbody>";

        // 出力
        $(selector).append(addHtml);
    }
}
