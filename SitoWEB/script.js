var web_service_address = 'http://localhost:8000'

var current_idx = 1
var sql_table = ''
var sql_1 = ''
var sql_2 = ''
var sql_3 = ''

function ImpostaValoreSelezionato (Riga, Valore, Campo, FromSelection) {
  $('#riga' + Riga).find('.txt_campo' + Campo).val(Valore)

  const readonly = $('#riga' + Riga).find('.txt_campo' + Campo).attr('readonly') == 'readonly'

  if (isNaN(Valore) && !readonly && !FromSelection) { Valore = '"' + Valore + '"' }
  $('#riga' + Riga).find('.txt_campo' + Campo).text(Valore)

  GetWhereClause()
}
function SetValueField(){
	if(sql_1 == "UPDATE ")
		SetUpdateValueField()
	else if(sql_1 == "INSERT INTO")
		SetInsertValueField()
}
function RefreshSQLCode(){
	$('#sql_code').val(sql_1 + ' ' + sql_table + ' ' + sql_2 + ' ' + sql_3)
}
function SetUpdateValueField () {
  let sql = ''

  $('#tbl_body_fields  > tr').each(function (i, row) {
    row = $(row).find('input[type=text],input:not([readonly])')

    const field = $(row[1]).data('field')
    var val = $(row[1]).val()
	if (isNaN(val)) { val = '"' + val + '"'}
    if (val == '') { return }
    if (sql == '') { sql += ' ' + field + '=' + val + ' ' } else { sql += ', ' + field + '=' + val + ' ' }
  })

  sql = ' SET ' + sql

  sql_2 = sql
  
	RefreshSQLCode()
	
}
function SetInsertValueField () {
  
  let fields = ''
  let values = ''
  $('#tbl_body_fields  > tr').each(function (i, row) {
    row = $(row).find('input[type=text],input:not([readonly])')

    const field = $(row[1]).data('field')
    var val = $(row[1]).val()
	if (isNaN(val)) { val = '"' + val + '"'}
    if (val == '') { return }
    
	fields += field + ','
	values += val + ','
  })

	fields = fields.substring(0, fields.length - 1)
	values = values.substring(0, values.length - 1)
	
  sql_2 = ' ( '+fields+' ) '+ ' VALUES ( ' + values + ' )'

  RefreshSQLCode()
}
function ImpostaCondizioneSelezionata (Riga, Cond) {
  $('#riga' + Riga).find('.btn').data('data-condizione', Cond)
  GetWhereClause()
}

function GetWhereClause () {
  var campo1
  var campo2

  let sql = 'WHERE'
  let condizione

  $('#tbl_body_conditions  > tr').each(function (i, row) {
    campo1 = $(row).find('.txt_campo1').text()
    campo2 = $(row).find('.txt_campo2').text()

    condizione = $(row).find('.btn').data('data-condizione')
    if (condizione == undefined) { condizione = '=' }
    if (campo1 != '' && campo2 != '') { sql += ' ' + campo1 + ' ' + condizione + ' ' + campo2 + ' AND' }
  })

  if (sql == 'WHERE') { sql_3 = '' } else { sql_3 = sql.substring(0, sql.length - 3) }

  RefreshSQLCode()
}

$(document).ready(function () {
  $('#btn_clear').click(function () {
	sql_1=""
	sql_2="";
	sql_3="";
	sql_table="";
	current_idx=1;
		  
	for (let i = 1; i <= 3; i++) {
		$('#qry_' + i).addClass('hidden')
	}

	$('#qry_' + current_idx).removeClass('hidden')
	$('#page-item-next').removeClass('disabled')
	$('#page-item-prev').addClass('disabled')
		  
    $('#sql_code').val('')
	$('#sql_risultato').html('');
	$('#sql_explain').html('');
  })
  $('#btn_select').click(function () {
    sql_1 = 'SELECT '
    $('#sql_code').val(sql_1)
    CreaTreeView(true)
  })
  $('#btn_insert').click(function () {
    sql_1 = 'INSERT INTO'
    CreaTreeView(false)
    $('#sql_code').val(sql_1)
  })
  $('#btn_update').click(function () {
    sql_1 = 'UPDATE '
    $('#sql_code').val(sql_1)
    CreaTreeView(false)
  })
  $('#btn_delete').click(function () {
    sql_1 = 'DELETE FROM'
    CreaTreeView(false)
    $('#sql_code').val(sql_1)
  })

  $('#pager_next').click(function () {
    current_idx += 1

    for (let i = 1; i <= 3; i++) {
      $('#qry_' + i).addClass('hidden')
    }

    $('#qry_' + current_idx).removeClass('hidden')
    $('#page-item-prev').removeClass('disabled')

    if (current_idx == 3 && (sql_1 == 'UPDATE ' || sql_1 == 'INSERT INTO')) {
      CreaTabellaCampi()
      const tbl_campi = $('#qry_fields').html()
      $('#qry_fields').empty()
      $('#qry_3').prepend(tbl_campi)
    }

    if (current_idx == 3) { $('#page-item-next').addClass('disabled') }
  })
  $('#pager_prev').click(function () {
    sql_3 = ''
    current_idx -= 1

    for (let i = 1; i <= 3; i++) {
      $('#qry_' + i).addClass('hidden')
    }

    $('#qry_' + current_idx).removeClass('hidden')

    $('#page-item-next').removeClass('disabled')
    if (current_idx == 1) { $('#page-item-prev').addClass('disabled') }
  })

  $('#risultato').click(function () {
    $('#lbl_risultato').addClass('active')
    $('#lbl_explain').removeClass('active')

    $('#div_risultato').removeClass('hidden')
    $('#div_explain').addClass('hidden')
  })
  $('#explain').click(function () {
    $('#lbl_risultato').removeClass('active')
    $('#lbl_explain').addClass('active')

    $('#div_risultato').addClass('hidden')
    $('#div_explain').removeClass('hidden')
  })

  $('#esegui').click(function () {
	  $.getJSON(web_service_address + '/run?query=' + GetSql(), function (data) {
		  
		if(data.error!=''){
			alert("Errore nella query: "+data.error.sqlMessage)
			return
		}
      var tbl_ris 	= CreaTabellaDati(data.rows)
      var tbl_explain	= CreaTabellaDati(data.explain)

      $('#sql_risultato').html(tbl_ris)
      $('#sql_explain').html(tbl_explain)
	  })
  })

  $('.table-add').on('click', 'i', () => {
    CreaTabellaCondizioni()
    GetWhereClause()
  })

  $('#table_Conditions').on('click', '.table-remove', function () {
	   $(this).parents('tr').detach()
	   GetWhereClause()
	 })

  function CreaTreeView (full) {
    $.getJSON(web_service_address + '/getall', function (data) {
      const tree = DataToTreeView(data, full)
      $('#jstree').jstree('destroy')
			 $('#jstree').jstree({
			  plugins: ['search', 'checkbox', 'wholerow'],
			  core: {
          data: tree,
          animation: false,
          // 'expand_selected_onload': true,
          themes: {
				  icons: false
          }
			  },
			  search: {
          show_only_matches: true,
          show_only_matches_children: true
			  }
      })
      $('#jstree').jstree('refresh')

      $('#search').on('keyup change', function () {
				  $('#jstree').jstree(true).search($(this).val())
      })

      $('#clear').click(function (e) {
		  $('#search').val('').change().focus()
      })

      $('#jstree').on('changed.jstree', function (e, data) {
			  if (current_idx != 2) return

			  sql_2 = ''
			  var objects = data.instance.get_selected(true)
			switch(sql_1){
				case 'SELECT ':
				 
				 var tables = GetTablesSelected()

				  for (var i in objects) {
					if (objects[i].parent != '#') {
					  const get_json = data.instance.get_json()
					  const tbl = GetParent(get_json, objects[i].parent)
					  sql_2 += tbl + '.' + objects[i].text + ','
					}
				  }
				sql_2 = sql_2.substring(0, sql_2.length - 1)
				sql_2 += ' FROM ' + tables;
				
					break;
				case 'INSERT INTO':
				
					var tables = GetTablesSelected()

					for (var i in objects) {
						if (objects[i].parent != '#') {
						const get_json = data.instance.get_json()
						const tbl = GetParent(get_json, objects[i].parent)
						sql_2 += tbl + '.' + objects[i].text + ','
						}
					}
					
					CreaTabellaCampi()
					sql_table=""
					for (var i in tables) {
						sql_table += tables[i] + ','
					}
					sql_table = sql_table.substring(0, sql_table.length - 1)
					
					break;
				case 'UPDATE ':
				
					var tables = GetTablesSelected()
					/*
					for (var i in objects)
						if (objects[i].parent == '#') { sql_2 += objects[i].text + ',' }
					*/
					CreaTabellaCampi()
					sql_table=""
					for (var i in tables) {
						sql_table += tables[i] + ','
					}
					sql_table = sql_table.substring(0, sql_table.length - 1)

					
					break;
				case 'DELETE FROM':
					
					sql_table ="";
					
					var tables = GetTablesSelected()					
					
					for (var i in tables) {
						sql_table += tables[i] + ','
					}
					sql_table = sql_table.substring(0, sql_table.length - 1)

					break;
			}
			
			$('#tbl_body_conditions').empty()
			CreaTabellaCondizioni()
				/*
			  var leaves = $.grep(objects, function (o) { return data.instance.is_leaf(o) })
			  var list = $('#output')
			  list.empty()
			  $.each(leaves, function (i, o) {
          $('<li/>').text(o.text).appendTo(list)
			  })
			  */
			  RefreshSQLCode()
      })
    })
  }
  function GetTablesSelected () {
    var tables = []

    var objects = $('#jstree').jstree('get_selected', true)
    for (var i in objects) {
      if (objects[i].parent == '#') {
        tables = ArrayAddIfNotExist(tables, objects[i].text)
      } else {
        const get_json = $('#jstree').jstree('get_json')
        const tbl = GetParent(get_json, objects[i].parent)

        tables = ArrayAddIfNotExist(tables, tbl)
      }
    }
    return tables
  }
  function GetSql () {
    return $('#sql_code').val()
  }
	    $('#add_row').on('click', function () {
    // Dynamic Rows Code

    // Get max row id and set new id
    var newid = 0
    $.each($('#tab_logic tr'), function () {
      if (parseInt($(this).data('id')) > newid) {
        newid = parseInt($(this).data('id'))
      }
    })
    newid++

    var tr = $('<tr></tr>', {
      id: 'addr' + newid,
      'data-id': newid
    })

    // loop through each td and create new elements with name of newid
    $.each($('#tab_logic tbody tr:nth(0) td'), function () {
      var td
      var cur_td = $(this)

      var children = cur_td.children()

      // add new td and element if it has a nane
      if ($(this).data('name') !== undefined) {
        td = $('<td></td>', {
          'data-name': $(cur_td).data('name')
        })

        var c = $(cur_td).find($(children[0]).prop('tagName')).clone().val('')
        c.attr('name', $(cur_td).data('name') + newid)
        c.appendTo($(td))
        td.appendTo($(tr))
      } else {
        td = $('<td></td>', {
          text: $('#tab_logic tr').length
        }).appendTo($(tr))
      }
    })

    // add delete button and td
    /*
        $("<td></td>").append(
            $("<button class='btn btn-danger glyphicon glyphicon-remove row-remove'></button>")
                .click(function() {
                    $(this).closest("tr").remove();
                })
        ).appendTo($(tr));
        */

    // add the new row
    $(tr).appendTo($('#tab_logic'))

    $(tr).find('td button.row-remove').on('click', function () {
      $(this).closest('tr').remove()
    })
  })

  // Sortable Code
  var fixHelperModified = function (e, tr) {
    var $originals = tr.children()
    var $helper = tr.clone()

    $helper.children().each(function (index) {
      $(this).width($originals.eq(index).width())
    })

    return $helper
  }
  /*
    $(".table-sortable tbody").sortable({
        helper: fixHelperModified
    }).disableSelection();

    $(".table-sortable thead").disableSelection();
	*/
  $('#add_row').trigger('click')
  function ArrayAddIfNotExist (arr, search) {
    let trovato = false

    for (var i in arr) {
      if (arr[i] == search) { trovato = true }
    }

    if (!trovato) { arr.push(search) }

    return arr
  }
  function GetParent (arr_obj, search_id) {
    for (var i in arr_obj) {
      if (arr_obj[i].id == search_id) { return arr_obj[i].text }
    }
  }
  function DataToTreeView (data, full) {
    var ris = []

    $.each(data, function () {
      if (!full) { this.fields = [] }

      const onerow = {
        text: this.tablename,
        state: {
          opened: 0,
          disabled: 0,
          selected: 0
        },
        children: DataChildrenToTreeView(this.fields),
        li_attr: {},
        a_attr: {}
      }
      ris.push(onerow)
    })

    return ris
  }

  function DataChildrenToTreeView (data) {
    var ris = []

    $.each(data, function () {
      ris.push({ text: this.Field })
    })

    return ris
  }
  function CreaTabellaCampi () {
    var tbl = ''
    var tabelle = GetTablesSelected()

    for (var i in tabelle) {
      $.getJSON(web_service_address + '/fields?table=' + tabelle[i])
        .then(function (data) {
          for (var d in data.Rows) {
            tbl += `		
				<tr>					
					<td>
						<input type="text" readonly class="form-control-plaintext" value="` + data.Table + '.' + data.Rows[d].Field + `">
					</td>
					<td >
						<input type="text" data-field="` + data.Table + '.' + data.Rows[d].Field + `" onkeyup="$(this).trigger('change');" onchange="SetValueField();" placeholder="" class="form-control">
					</td>
				</tr>
				`
          }
          $('#tbl_body_fields').html(tbl)
        })
        .fail(function () {
        // ...didn't work, handle it
        })
    }
  }
  function CreaTabellaDati (data) {
	var tbl_body = ''	
    
    var odd_even = false

    tbl_body += '<thead><tr>'
    for (var key in data[0]) {
      tbl_body += '<th>' + key + '</th>'
    }
    tbl_body += '</tr></thead>'

    $.each(data, function () {
      var tbl_row = ''
      $.each(this, function (k, v) {
        tbl_row += '<td>' + v + '</td>'
      })
      tbl_body += '<tr class="' + (odd_even ? 'odd' : 'even') + '">' + tbl_row + '</tr>'
      odd_even = !odd_even
    })
    return tbl_body
  }
  function CreaTabellaCondizioni () {
    var tbl

    var promises = []
    var tabelle = GetTablesSelected()

    for (var i in tabelle) {
      promises.push($.getJSON(web_service_address + '/fields?table=' + tabelle[i]))
    }

    $.when.apply($, promises).then(function (data) {

    }, function (e) {
    }).always(function () {
      var lista1 = ''
      var lista2 = ''
      var data
      var rowCount = $('#table_Conditions tr').length

      $.each(promises, function (i) {
        data = this.responseJSON
        for (var d in data.Rows) {
          lista1 += "<a class='dropdown-item' onclick=" + '"' + 'ImpostaValoreSelezionato(' + rowCount + ",'" + data.Table + '.' + data.Rows[d].Field + "',1,1); " + '"' + " href='#'>" + data.Table + '.' + data.Rows[d].Field + '</a>'
          lista2 += "<a class='dropdown-item' onclick=" + '"' + 'ImpostaValoreSelezionato(' + rowCount + ",'" + data.Table + '.' + data.Rows[d].Field + "',2,1); " + '"' + " href='#'>" + data.Table + '.' + data.Rows[d].Field + '</a>'
        }
      })

      tbl = `		
			<tr id="riga` + rowCount + `">
				<td>		
					<div class="input-group">			
						<div class="input-group-append">
						  <input type="text" class="form-control txt_campo1" readonly aria-label="Text input with dropdown button">
						  <div class="input-group-prepend">
							<button class="btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>
							<div class="dropdown-menu f-inherit">` + lista1 + `</div>
						  </div>
						</div>
					</div>
				</td>
				<td>
					<div class="text-center dropdown">
						<button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
							Condizioni
						</button>
						<div class="dropdown-menu f-inherit" aria-labelledby="dropdownMenuButton">
							<a class="dropdown-item" onclick="ImpostaCondizioneSelezionata(` + rowCount + `,'=')" href="#">uguale (=)</a>
							<a class="dropdown-item" onclick="ImpostaCondizioneSelezionata(` + rowCount + `,'<>')" href="#">diverso (<>)</a>
							<a class="dropdown-item" onclick="ImpostaCondizioneSelezionata(` + rowCount + `,'>')" href="#">maggiore (>)</a>
							<a class="dropdown-item" onclick="ImpostaCondizioneSelezionata(` + rowCount + `,'>=')" href="#">maggiore uguale (>=)</a>
							<a class="dropdown-item" onclick="ImpostaCondizioneSelezionata(` + rowCount + `,'<')" href="#">minore (<)</a>
							<a class="dropdown-item" onclick="ImpostaCondizioneSelezionata(` + rowCount + `,'<=')" href="#">minore uguale (<=)</a>
							<a class="dropdown-item" onclick="ImpostaCondizioneSelezionata(` + rowCount + `,'%')" href="#">contiene</a>
						</div>
					</div>
				</td>
				<td>
					<div class="input-group">			
						<div class="input-group-append">
						  <input type="text" class="form-control txt_campo2" onkeyup="ImpostaValoreSelezionato(` + rowCount + `,this.value,2,0);" aria-label="Text input with dropdown button">
						  <div class="input-group-prepend">
							<button class="btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>
							<div class="dropdown-menu f-inherit">` + lista2 + `</div>
						  </div>
						</div>
					</div>
				</td>
				<td>
					<span class="table-remove float-right mb-3 mr-2">
						<a href="#!" class="text-danger"><i class="fa fa-window-close fa-2x" aria-hidden="true"></i></a>
					</span>
				</td>
			</tr>
					`

      $('#tbl_body_conditions').append(tbl)
    })
  }
})

$('input.form-control.txt_campo2').bind('input', function () {
  console.log($(this).val())
  $(this).val() // get the current value of the input field.
})
