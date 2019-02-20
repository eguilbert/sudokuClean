
var $ = require('../vendor/jquery-2.0.3.min.js');
// var attachFastClick = require('../vendor/fastclick.js');

/**
 * A Javascript implementation of a Sudoku game, including a
 * backtracking algorithm solver. 
 *BASED ON THE SOLVER MADE BY Moriel Schottlender
 */

var Sudoku = ( function ( $ ){

  var _instance, _game,
    /**
		 * Default configuration options. These can be overriden
		 * when loading a game instance.
		 * @property {Object}
		 */
    defaultConfig = {
      // If set to true, the game will validate the numbers
      // as the player inserts them. If it is set to false,
      // validation will only happen at the end.
      "validate_on_insert": true,
      // If set to true, the system will display the elapsed
      // time it took for the solver to finish its operation.
      "show_solver_timer": true,
      // If set to true, the recursive solver will count the
      // number of recursions and backtracks it performed and
      // display them in the console.
      "show_recursion_counter": true,
      // If set to true, the solver will test a shuffled array
      // of possible numbers in each empty input box.
      // Otherwise, the possible numbers are ordered, which
      // means the solver will likely give the same result
      // when operating in the same game conditions.
      "solver_shuffle_numbers": true
    },
    selectedCase,
    level,
    selectedCoord,
    notes = false,
    // started = false,
    gridState = 'empty';
  /**
	 * Initialize the singleton
	 * @param {Object} config Configuration options
	 * @returns {Object} Singleton methods
	 */
  function init( config ) {

    var conf = $.extend( {}, defaultConfig, config );
    _game = new Game( conf );
    // console.log("conf=",conf)
    /** Public methods **/
    return {
      /**
			 * Return a visual representation of the board
			 * @returns {jQuery} Game table
			 */
      getGameBoard: function() {
        return _game.buildGUI();
      },
      /**
			 * Reset the game board.
			 */
      reset: function() {
        _game.resetGame();
      },
      showM: function() {
        _game.showMatrices();
      },
      showSolution: function() {
        _game.showSolution();
      },
      showModale: function(display, message, prompt, callback) {
        _game.toggleModale(display, message, prompt, callback);
      },

      // Restart same grid (and remove values entered)
      // restartGrid: function(){
      //   alert("done")
      //     _game.resetGridStyles();
      //     _game.removeValues();
      // },
      /**
			 * Call for a validation of the game board.
			 * @returns {Boolean} Whether the board is valid
			 */
      validate: function() {
        var isValid;
        isValid = _game.validateMatrix();
        $( ".sudoku-container" ).toggleClass( "valid-matrix", isValid );
      },
      createSudoku: function(levelChosen) {
        $(".numbers button span").fadeOut();
        gridState = 'started';
        // started = true;
        _game.toggleModale(0);
        $("#tools button").attr("disabled", false);
        _game.resetHideCases();
        $('.levels button').removeClass('active');
        if(levelChosen===0){
          // initiate left Numbers
          for (var i = 1; i < 10; i++) {
            var unit = {"init": 0, "left":0};
            _game.leftNumbers[i]= unit;
          }
          level = "easy";

        } else if (levelChosen===1){
          level = "medium";
        } else if (levelChosen===2){
          level = "hard";
        }
        $('.levels #create-' + level ).addClass('active');
        $('#new-game').removeClass().addClass('mode-' + level)
        this.reset();
        this.solve();
        this.solve();
        _game.removeValues();
      },

      toggleNotes: function(option) {
        if(option) {
          $('.sudoku-container').addClass('notes-mode')
        } else {
          $('.sudoku-container').removeClass('notes-mode')
        }
        notes = option;
      },

      /**
			 * Call for the solver routine to solve the current
			 * board.
			 */
      solve: function() {
        var isValid, starttime, endtime, elapsed;
        // Make sure the board is valid first
        if ( !_game.validateMatrix() ) {
          return false;
        }
        // Reset counters
        _game.recursionCounter = 0;
        _game.backtrackCounter = 0;

        // Check start time
        starttime = Date.now();

        // Solve the game
        isValid = _game.solveGame( 0, 0 );
        // Get solving end time
        endtime = Date.now();

        // Visual indication of whether the game was solved
        $( ".sudoku-container" ).toggleClass( "valid-matrix", isValid );
        if ( isValid ) {
          $( ".valid-matrix input" ).attr( "disabled", "disabled" );
        }

        // Display elapsed time
        if ( _game.config.show_solver_timer ) {
          elapsed = endtime - starttime;
          window.console.log( "Solver elapsed time: " + elapsed + "ms" );
        }
        // Display number of recursions and backtracks
        if ( _game.config.show_recursion_counter ) {
          window.console.log( "Solver recursions: " + _game.recursionCounter );
          window.console.log( "Solver backtracks: " + _game.backtrackCounter );
        }
      },
      // FN To MOVE into Game object
      selectNumber: function(val){
        selectedCase?this.fillCase(val):_game.showSelectedNumbersInGrid(val);
      },
      // To MOVE into Game object
      fillCase: function(val){
        console.log(gridState)
        var isValid = true,
          oldVal = $(selectedCase).html(),
          row = selectedCoord["row"],
          col = selectedCoord["col"];

        // Display
        _game.showSelectedNumbersInGrid(val);
        if(gridState === 'started') {
          if(!notes){
            // New val or same val? Impacts on
            // console.log("_game.leftNumbers",_game.leftNumbers);

            if(oldVal) {
              if(oldVal!=val) {
                _game.updateLeftNumbers(oldVal,"up");
                if(val){_game.updateLeftNumbers(val,"down");}
              }
            } else {
              _game.updateLeftNumbers(val,"down");
            }
            // console.log("left after choosing ", _game.leftNumbers)
            selectedCase.html(val);
            $(selectedCase).parent().find(".notes-grid span").removeClass("selectedNote");

            if (_game.config.validate_on_insert) {
              isValid = _game.validateNumber( val, row, col, _game.matrix.row[row][col] );
              if(level !=="hard") {
                // Indicate error
                $( selectedCase ).toggleClass( "sudoku-input-error", !isValid );

              }
            }

            // Check if grid full And Game Over;
            for (var i = 1, sumCases=0; i < 10; i++) {
              sumCases = sumCases + _game.leftNumbers[i]["left"];
            }
            if(sumCases == 0){
              this.showSolution();
              var result;
              if(isValid){
                result = JSON.stringify('<span class="big win">Bravo!</span><br /> On continue? Choisissez un niveau.')
              } else {
                result = JSON.stringify('<span class="big fail">Dommage.</span><br /> Ne vous découragez pas et essayez encore.')
              }
              _game.toggleModale(2, result);
              $('.modale').addClass('small');
            }
            _game.putInMatrix(val,row,col);
            // NOTES ON
          } else {
            $(selectedCase).removeClass("sudoku-input-error");
            // Removing Case content
            if(oldVal) {
              $(selectedCase).html("");
              _game.updateLeftNumbers(oldVal,"down");
            }
            // console.log("NOTES",selectedCase);
            var notesDiv = $(selectedCase).parent().find(".notes-grid span:nth-child(" + val + ")");
            // console.log("hasClass?",$(notesDiv).hasClass('selectedNote'))
            if(val) {
              $(notesDiv).hasClass("selectedNote")?$(notesDiv).removeClass("selectedNote"):$(notesDiv).addClass("selectedNote");
            }
          }

        }

      }
    };
  }

  /**
	 * Sudoku singleton engine
	 * @param {Object} config Configuration options
	 */
  function Game( config ) {
    this.config = config;
    // Initialize game parameters
    this.recursionCounter = 0;
    this.$cellMatrix = {};
    this.matrix = {};
    this.leftNumbers = {};
    this.validation = {};
    this.solution = {};
    this.hideCasesSet = [];
    this.resetAllMatrices();
    return this;
  }
  /**
	 * Game engine prototype methods
	 * @property {Object}
	 */
  Game.prototype = {
    /**
		 * Build the game GUI
		 * @returns {jQuery} Table containing 9x9 input matrix
		 */
    buildGUI: function() {
      var $td, $tr, $notesGrid,
        $table = $( "<table>" )
          .addClass( "sudoku-container" );

      for ( var i = 0; i < 9; i++ ) {
        $tr = $( "<tr>" );
        this.$cellMatrix[i] = {};

        for ( var j = 0; j < 9; j++ ) {
          // Build the input
          this.$cellMatrix[i][j] = $( "<div class=\"cell row-"+ i + " col-"+j +"\">" )
          // .attr( 'maxlength', 1 )
          // .attr( 'disabled', true )
            .data( "row", i )
            .data( "col", j )
            .attr("data-isEditable", true)
          // .on( 'keyup', $.proxy( this.onKeyUp, this ) );
            .on( "mousedown", $.proxy( this.onSelect, this ) );

          // Notes grid
          $notesGrid = "<div class='notes-grid'><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span >6</span><span>7</span><span>8</span><span>9</span></div>";

          $td = $( "<td>" ).append( this.$cellMatrix[i][j]);
          $td.prepend($notesGrid);

          // Calculate section ID
          var sectIDi = Math.floor( i / 3 );
          var sectIDj = Math.floor( j / 3 );
          var section = sectIDj + (sectIDi * 3) ;
          // Set the design for different sections
          if ( ( sectIDi + sectIDj ) % 2 === 0 ) {
            $td.addClass( "sudoku-section-one");
          } else {
            $td.addClass( "sudoku-section-two" );
          }
          var sectionClass = "sec-" + section;
          $td.addClass( sectionClass );
          // Build the row
          $tr.append( $td );
        }
        // Append to table
        $table.append( $tr );
      }
      // Return the GUI table
      return $table;
    },
    // Restart same grid (and remove values entered)
    restartGrid: function(){
      gridState = 'started';
      this.resetGridStyles();
      this.removeValues();
    },

    /**
		 * Handle events.
		 *
		 * @param {jQuery.event} e Keyup event
		 */
    onSelect: function( e ) {
      console.log("GRIDSTATE", gridState)
      if (gridState === 'started') {
        console.log("GRIDSTATE nonetheless", gridState)
        var iseditable = $( e.currentTarget ).attr( "data-isEditable" );
        $(this.$cellMatrix[1]).addClass("selected");
        if(iseditable==="true") {
          // Reset the grid
          console.log("iseditable", iseditable)
          this.endSelection();
          $( e.currentTarget ).addClass("selected");
          var row = $( e.currentTarget ).data( "row" ),
          col = $( e.currentTarget ).data( "col" );
          selectedCase = $(e.currentTarget);
          selectedCoord = {row,col};
          var rowClass = $( e.currentTarget).attr("class").split(" ")[1];
          var colClass = $( e.currentTarget).attr("class").split(" ")[2];
          var secIndex = (Math.floor(row/3)*3) + Math.floor(col/3);
          $("." + colClass).addClass("showInGrid");
          $(".sec-" + secIndex).addClass("showInGrid");
          $( e.currentTarget ).parent().parent().addClass( "showInGrid");
        }
      }
    },
    endSelection: function(){
      $( ".cell" ).removeClass("selected").removeClass("showSelection");
      $( "tr" ).removeClass("showInGrid");
      $( "td" ).removeClass("showInGrid");
      $( "div" ).removeClass("showInGrid");
    },
    findSectionFromRow: function(row,col){
      // var sectRow = Math.floor( row / 3 );
      // var sectCol = Math.floor( col / 3 );
      return secIndex = ( row % 3 ) * 3 + ( col % 3 );
    },
    toggleModale: function(display, message = '', prompt = false, callbackFn = "") {
      //Code for DISPLAY
      // 0: fadeOut
      // 1: fadeIn
      // 2: fadeIn and Out after a while
      var modaleContent =
        '<div class="dialog-overlay">' +
        '<div class="modale"><div class="close-btn">X</div><span class="message">Veuillez choisir un niveau pour commencer une nouvelle partie.</span></div>' +
        '</div>'
       ;

      if(display === 1){
        $('body').append(modaleContent);
        $(".modale .message").html(JSON.parse(message));
        $(".modale").fadeIn(300);
      } else if (display === 0){
        $(".modale").fadeOut(300);
      } else if (display === 2){
        $('body').append(modaleContent);
        $(".modale .message").html(JSON.parse(message));
        $(".modale").fadeIn(300).delay(4000).fadeOut(300);
      }
      $('.close-btn').click(function(e){
        $(".modale").fadeOut(300);
        $('.dialog-overlay').fadeOut(500, function () {
            $(this).remove();
          });
      });
      let that = this;
      if (prompt) {
          $(".modale .buttons").show();
          $(".modale").append('<div class="buttons"><button type="button" name="button" id="confirm" >Oui</button> <button type="button" name="button" id="cancel">Non</button></div>')
          $(".modale #confirm").click( function(){
            $(".modale").fadeOut(300);
            $(".modale .buttons").remove();
            if( callbackFn === 'restartGrid' ){
              that.restartGrid();
            } else {
              that.showSolution();
            }
            $('.dialog-overlay').fadeOut(500, function () {
                $(this).remove();
              });
          });
          $(".modale #cancel").click( function(){
            $(".modale").fadeOut(300);
            $(".modale .buttons").remove();
            $('.dialog-overlay').fadeOut(500, function () {
                $(this).remove();
              });
          });

      }
    },
    // FONCTIONS TEST ONLY
    showMatrices(){
      console.log("showM");
      console.log("MATRIX ROW");
      console.table(this.matrix.row);
      console.log("MATRIX SECT 0");
      console.table(this.matrix.sect[0]);
      console.table(this.matrix.sect[1]);
      console.log("VALIDATION ROW");
      console.table(this.validation.row);
      console.log("VALIDATION COL");
      console.table(this.validation.col);
      console.log("VALIDATION SECT 0");
      console.table(this.validation.sect[0]);
      console.table(this.validation.sect[1]);
      console.log("this.validation.sect[0][0][0]",this.validation.sect[0][0][0]);
      console.log("this.validation.sect[0][0][1]",this.validation.sect[0][0][1]);
      console.log("this.validation.sect[0][0][2]",this.validation.sect[0][0][2]);
      console.log("this.validation.sect[0][1][0]",this.validation.sect[0][1][0]);
      console.log("this.validation.sect[1][0][1]",this.validation.sect[1][0][1]);
      console.log("this.validation.sect[2][0][2]",this.validation.sect[2][0][2]);
      console.log("SOLUTION ");
      console.table(this.solution.row);
      console.log(" hideCasesSet ",this.hideCasesSet.length);
      console.log(" hideCasesSet ",this.hideCasesSet[0]);
      console.log(" hideCasesSet ",this.hideCasesSet);
      console.log(" hideCasesSet ",typeof(this.hideCasesSet));
      console.log(" left numbers ",this.leftNumbers);
    },
    putInMatrix: function(val,row,col){
      var sectRow, sectCol, secIndex;
      sectRow = Math.floor( row / 3 );
      sectCol = Math.floor( col / 3 );
      secIndex = ( row % 3 ) * 3 + ( col % 3 );

      // Cache value in matrix
      this.matrix.row[row][col] = val;
      this.matrix.col[col][row] = val;
      this.matrix.sect[sectRow][sectCol][secIndex] = val;

    },
    // DISPLAY fn
    showSelectedNumbersInGrid: function(val){
      $(".cell").removeClass( "showSelection");
      $(".cell:contains("+val+")").addClass( "showSelection");
    },

    // Reset all styles in the grid
    resetGridStyles: function() {
      $( ".sudoku-container" ).removeClass("grid-easy").removeClass("grid-medium").removeClass("grid-hard");
      $( ".cell" ).removeClass("selected").removeClass("showSelection").removeClass("good-value").removeClass("wrong-value");
      $( "tr" ).removeClass("showInGrid");
      $( "td" ).removeClass("showInGrid");
      $( "div" ).removeClass("showInGrid").removeClass("sudoku-input-error");
      $( "div span" ).removeClass("selectedNote");
    },
    resetLeftNumbers: function() {
      for (var i = 1; i < 10; i++) {
        this.leftNumbers[i] = {"init": 0, "left":0};
      }
      return this.leftNumbers;
    },
    // Prepare Matrices for new Grid
    removeValues: function(){
      var modeGrid,
        cases = [];
      this.hideCasesSet.length>0? modeGrid = "restartSameGrid": modeGrid = "newGrid";

      // RESTART SAME GRID
      if(modeGrid === "restartSameGrid") {
        // We are reusing the same set of cases to hide;
        cases = Array.from(this.hideCasesSet);

        // BRAND NEW GRID
      } else {
        // Preparing a random set of cases to hide
        // 1. Pick a range of numbers depending on game level
        if (level ==="easy") {
          var nbCasesToHide = getRandomInt(35, 14);
        } else if (level ==="medium") {
          var nbCasesToHide = getRandomInt(47, 10);
        } else if (level ==="hard") {
          var nbCasesToHide = getRandomInt(55, 7);
        }
        //2. Create an array of n random cases to hide
        var cases = [];
        while(cases.length < nbCasesToHide) {
          var r = Math.floor(Math.random()*80);
    			if(cases.indexOf(r) === -1) {cases.push(r);}
        }
        //3. Stock it for next time if restart needed
        this.hideCasesSet = Array.from(cases);

        // Prepare Grid
        for ( var i = 0; i < 9; i++ ) {
          for ( var j = 0; j < 9; j++ ) {
            this.$cellMatrix[i][j].attr("data-isEditable", false);
          }
        }

      }

      // EMPTYING THE GRID
      for (var i = 0; i < cases.length; i++) {
        // Finding case position in the grid
        if (cases[i] < 9) {
          var row = 0;
          var col = cases[i];
        } else {
          var row = Math.floor(cases[i] / 9) ;
          var col = cases[i] % 9;
        }

        // HIDING numbers
        var numToDel = 	this.$cellMatrix[row][col].html();
        this.$cellMatrix[row][col].html("");
        this.$cellMatrix[row][col].attr("data-isEditable", true);
        // Updating matrices

        var sectRow = Math.floor(row/3);
        var sectCol = Math.floor(col/3);
        var indexSection = ((row - (sectRow * 3)) * 3) + (col - (sectCol * 3));
        this.matrix.row[row][col]="";
        this.matrix.col[col][row]="";
        this.matrix.sect[sectRow][sectCol][indexSection]= "";
        if (modeGrid === "newGrid") {
          this.validation.row[row][col]= "";
          this.validation.col[col][row]= "";
          this.validation.sect[sectRow][sectCol][indexSection]= "";
          // Counting left cases to find
          var indexToDel = String(Number(numToDel));

          if (level==='easy'){
            this.leftNumbers[numToDel]["init"] = Number(this.leftNumbers[indexToDel]["init"])+1;
            this.leftNumbers[numToDel]["left"] = Number(this.leftNumbers[indexToDel]["left"])+1;
          }
        }

      }

      if(modeGrid === "restartSameGrid") {
        // Reset Validation Matrix
        // UPDATE VALIDATION
        for ( var i = 0; i < 9; i++ ) {
          for ( var j = 0; j < 9; j++ ) {
            var caseValue = this.$cellMatrix[i][j].html();
            if(caseValue){
              caseValue = Number(caseValue);
            }
            this.validation.row[i][j] = caseValue;
            this.validation.col[j][i] = caseValue;
          }
        }
        // Reset validation section
        for ( var row = 0; row < 3; row++ ) {
          for ( var col = 0; col < 3; col++ ) {
            for ( var val = 0; val < 9; val++ ) {
              if(this.matrix.sect[row][col][val]){
                this.validation.sect[row][col][val] = this.matrix.sect[row][col][val];
              } else {
                this.validation.sect[row][col][val] = "";
              }
            }
          }
        }
        // Reset Left numbers
        for ( var i = 1; i < 10; i++ ) {
          // console.log("left this.leftNumbers[i]", this.leftNumbers[i]);
          this.leftNumbers[i]["left"] = this.leftNumbers[i]["init"];
        }
      }

      $(".sudoku-container").addClass("grid-" + level);
      if(level==="easy") {
        this.updateDisplayLeftNumbers();
        $(".numbers button span").fadeIn();
      }
    },

    showSolution: function(){

      this.resetGridStyles();

      // Replace elements on the Grid

      for ( var row = 0; row < 9; row++ ) {
        var that = this;
        setTimeout(function(row) {
          for ( var col = 0; col < 9; col++ ) {
            var self = that;
            setTimeout(function(col) {
              // Reset GUI inputs
              var goodValue = self.solution.row[row][col];
              var userValue = self.$cellMatrix[row][col].attr("data-isEditable");
              if(userValue === "true") {
                if(self.$cellMatrix[row][col].html() == goodValue) {
                  self.$cellMatrix[row][col].addClass("good-value");
                } else {
                  self.$cellMatrix[row][col].addClass("wrong-value");
                }
              }
              self.$cellMatrix[row][col].html(String(goodValue));
            }, col * 50, col);
          }
        }, row * 50, row);
      }
      gridState = 'resolved';
    },
    // DISPLAY fn
    updateDisplayLeftNumbers: function(){
      console.log(level)
      for(var num in this.leftNumbers) {
        var left = this.leftNumbers[num]["left"];
        if(left < 0) { left = 0;}
        $("#num-"+ num + " span").html(left);
        if(left===0) {
          $("#num-"+ num + " span").addClass("empty");
        } else {
          $("#num-"+ num + " span").removeClass("empty");
        }
      }
    },
    updateLeftNumbers: function(val,upOrDown){
      if (upOrDown == "up") {
        this.leftNumbers[val]["left"]++;
      } else {
          this.leftNumbers[val]["left"]--;
      }
      this.updateDisplayLeftNumbers();
    },

    /**
		 * Reset the board and the game parameters
		 */
    resetGame: function() {
      this.resetGridStyles();
      this.resetAllMatrices();
      for ( var row = 0; row < 9; row++ ) {
        for ( var col = 0; col < 9; col++ ) {
          // Reset GUI inputs
          this.$cellMatrix[row][col].html( "" );
        }
      }
      $( ".sudoku-container" ).removeClass( "valid-matrix" );
    },
    resetHideCases: function(){
      // Reinitiate the set of hiding cases
      this.hideCasesSet = [""];
      this.hideCasesSet.length = 0;
    },
    /**
		 * Reset and rebuild the validation matrices
		 */
    resetAllMatrices: function() {
      this.resetValidationMatrices();
      this.matrix = { "row": {}, "col": {}, "sect": {} };
      this.solution = { "row": {}, "col": {} };

      // Build the row/col matrix and validation arrays
      for ( var i = 0; i < 9; i++ ) {
        this.matrix.row[i] = [ "", "", "", "", "", "", "", "", "" ];
        this.matrix.col[i] = [ "", "", "", "", "", "", "", "", "" ];
        this.solution.row[i] = [ "", "", "", "", "", "", "", "", "" ];
        this.solution.col[i] = [ "", "", "", "", "", "", "", "", "" ];
      }

      // Build the section matrix and validation arrays
      for ( var row = 0; row < 3; row++ ) {
        this.matrix.sect[row] = [];
        for ( var col = 0; col < 3; col++ ) {
          this.matrix.sect[row][col] = [ "", "", "", "", "", "", "", "", "" ];
        }
      }
    },
    resetValidationMatrices: function() {
      this.validation = { "row": {}, "col": {}, "sect": {} };

      // Build the row/col matrix and validation arrays
      for ( var i = 0; i < 9; i++ ) {
        this.validation.row[i] = [];
        this.validation.col[i] = [];
      }

      // Build the section matrix and validation arrays
      for ( var row = 0; row < 3; row++ ) {

        this.validation.sect[row] = {};
        for ( var col = 0; col < 3; col++ ) {
          this.validation.sect[row][col] = [];
        }
      }
    },
    /**
		 * Validate the current number that was inserted.
		 *
		 * @param {String} num The value that is inserted
		 * @param {Number} rowID The row the number belongs to
		 * @param {Number} colID The column the number belongs to
		 * @param {String} oldNum The previous value
		 * @returns {Boolean} Valid or invalid input
		 */
    validateNumber: function( num, rowID, colID, oldNum ) {
      // console.log("validateNumber new / old", num, oldNum)
      var isValid = true,
        // Section
        sectRow = Math.floor( rowID / 3 ),
        sectCol = Math.floor( colID / 3 );

      // This is given as the matrix component (old value in
      // case of change to the input) in the case of on-insert
      // validation. However, in the solver, validating the
      // old number is unnecessary.
      oldNum = oldNum || "";

      // Remove oldNum from the validation matrices,
      // if it exists in them.
      if ( this.validation.row[rowID].indexOf( oldNum ) > -1 ) {
        this.validation.row[rowID].splice(
          this.validation.row[rowID].indexOf( oldNum ), 1
        );
      }
      if ( this.validation.col[colID].indexOf( oldNum ) > -1 ) {
        this.validation.col[colID].splice(
          this.validation.col[colID].indexOf( oldNum ), 1
        );
      }
      if ( this.validation.sect[sectRow][sectCol].indexOf( oldNum ) > -1 ) {
        this.validation.sect[sectRow][sectCol].splice(
          this.validation.sect[sectRow][sectCol].indexOf( oldNum ), 1
        );
      }
      // Skip if empty value
      if ( num !== "" ) {
        // Validate value
        if (
        // Make sure value is numeric
          $.isNumeric( num ) &&
					// Make sure value is within range
					Number( num ) > 0 &&
					Number( num ) <= 9
        ) {
          // console.log("step1")
          // Check if it already exists in validation array
          if (
            $.inArray( num, this.validation.row[rowID] ) > -1
          ) {
            console.log("BAD in row",this.validation.row[rowID]);
            isValid = false;
          } else if (

            $.inArray( num, this.validation.col[colID] ) > -1
          ) {
            console.log("BAD in col",this.validation.col[colID]);
            isValid = false;
          } else if  (

            $.inArray( num, this.validation.sect[sectRow][sectCol] ) > -1
          ) {
            console.log("BAD in section");
            isValid = false;
          } else {
            isValid = true;
          }
        }
        // Insert new value into validation array even if it isn't
        // valid. This is on purpose: If there are two numbers in the
        // same row/col/section and one is replaced, the other still
        // exists and should be reflected in the validation.
        // The validation will keep records of duplicates so it can
        // remove them safely when validating later changes.
        // console.log("on pousse dans VALIDATION", num, rowID, colID)
        this.validation.row[rowID].push( num );
        this.validation.col[colID].push( num );
        this.validation.sect[sectRow][sectCol].push( num );
      }
      // console.log("isValid",isValid)
      return isValid;
    },

    /**
		 * Validate the entire matrix
		 * @returns {Boolean} Valid or invalid matrix
		 */
    validateMatrix: function() {
      // console.log("ValidateMatrix")
      // console.log("Validation Matrix", this.validation)
      var isValid, val, $element,
        hasError = false;

      // Go over entire board, and compare to the cached
      // validation arrays
      for ( var row = 0; row < 9; row++ ) {
        for ( var col = 0; col < 9; col++ ) {
          val = this.matrix.row[row][col];
          // Validate the value
          isValid = this.validateNumber( val, row, col, val );
          this.$cellMatrix[row][col].toggleClass( "sudoku-input-error", !isValid );
          if ( !isValid ) {
            hasError = true;
            // console.log("BAD");
          }
        }
      }
      this.solution = $.extend( {}, this.matrix );
      // this.solution = $.extend( {}, this.matrix );
      this.solution = JSON.parse(JSON.stringify(this.matrix));
      return !hasError;
    },

    /**
		 * A recursive 'backtrack' solver for the
		 * game. Algorithm is based on the StackOverflow answer
		 * http://stackoverflow.com/questions/18168503/recursively-solving-a-sudoku-puzzle-using-backtracking-theoretically
		 */
    solveGame: function( row, col ) {

      var cval, sqRow, sqCol, $nextSquare, legalValues,
        sectRow, sectCol, secIndex, gameResult;
      // console.table(this.matrix.row)
      // console.table(this.matrix.col)
      this.recursionCounter++;
      $nextSquare = this.findClosestEmptySquare( row, col );
      if ( !$nextSquare ) {
        // End of board
        return true;
      } else {
        sqRow = $nextSquare.data( "row" );
        sqCol = $nextSquare.data( "col" );
        legalValues = this.findLegalValuesForSquare( sqRow, sqCol );

        // Find the segment id
        sectRow = Math.floor( sqRow / 3 );
        sectCol = Math.floor( sqCol / 3 );
        secIndex = ( sqRow % 3 ) * 3 + ( sqCol % 3 );

        // Try out legal values for this cell
        for ( var i = 0; i < legalValues.length; i++ ) {
          cval = legalValues[i];
          // Update value in input
          $nextSquare.html( cval );
          // Update in matrices
          this.matrix.row[sqRow][sqCol] = cval;
          this.matrix.col[sqCol][sqRow] = cval;
          this.matrix.sect[sectRow][sectCol][secIndex] = cval;

          // console.log("val matrix", this.validation)
          // Recursively keep trying
          if ( this.solveGame( sqRow, sqCol ) ) {

            this.validation.row[sqRow].push( cval );
            this.validation.col[sqCol].push( cval );
            this.validation.sect[sectRow][sectCol].push( cval );

            return true;
          } else {
            // There was a problem, we should backtrack
            this.backtrackCounter++;

            // Remove value from input
            this.$cellMatrix[sqRow][sqCol].html( "" );
            // Remove value from matrices
            this.matrix.row[sqRow][sqCol] = "";
            this.matrix.col[sqCol][sqRow] = "";
            this.matrix.sect[sectRow][sectCol][secIndex] = "";
          }
        }
        // If there was no success with any of the legal
        // numbers, call backtrack recursively backwards
        return false;
      }
    },

    /**
		 * Find closest empty square relative to the given cell.
		 *
		 * @param {Number} row Row id
		 * @param {Number} col Column id
		 * @returns {jQuery} Input element of the closest empty
		 *  square
		 */
    findClosestEmptySquare: function( row, col ) {
      var walkingRow, walkingCol, found = false;
      for ( var i = ( col + 9*row ); i < 81; i++ ) {
        walkingRow = Math.floor( i / 9 );
        walkingCol = i % 9;
        if ( this.matrix.row[walkingRow][walkingCol] === "" ) {
          found = true;
          return this.$cellMatrix[walkingRow][walkingCol];
        }
      }
    },

    /**
		 * Find the available legal numbers for the square in the
		 * given row and column.
		 *
		 * @param {Number} row Row id
		 * @param {Number} col Column id
		 * @returns {Array} An array of available numbers
		 */
    findLegalValuesForSquare: function( row, col ) {
      var legalVals, legalNums, val, i,
        sectRow = Math.floor( row / 3 ),
        sectCol = Math.floor( col / 3 );

      legalNums = [ 1, 2, 3, 4, 5, 6, 7, 8, 9];

      // Check existing numbers in col
      for ( i = 0; i < 9; i++ ) {
        val = Number( this.matrix.col[col][i] );
        if ( val > 0 ) {
          // Remove from array
          if ( legalNums.indexOf( val ) > -1 ) {
            legalNums.splice( legalNums.indexOf( val ), 1 );
          }
        }
      }

      // Check existing numbers in row
      for ( i = 0; i < 9; i++ ) {
        val = Number( this.matrix.row[row][i] );
        if ( val > 0 ) {
          // Remove from array
          if ( legalNums.indexOf( val ) > -1 ) {
            legalNums.splice( legalNums.indexOf( val ), 1 );
          }
        }
      }

      // Check existing numbers in section
      sectRow = Math.floor( row / 3 );
      sectCol = Math.floor( col / 3 );
      for ( i = 0; i < 9; i++ ) {
        val = Number( this.matrix.sect[sectRow][sectCol][i] );
        if ( val > 0 ) {
          // Remove from array
          if ( legalNums.indexOf( val ) > -1 ) {
            legalNums.splice( legalNums.indexOf( val ), 1 );
          }
        }
      }

      if ( this.config.solver_shuffle_numbers ) {
        // Shuffling the resulting 'legalNums' array will
        // make sure the solver produces different answers
        // for the same scenario. Otherwise, 'legalNums'
        // will be chosen in sequence.
        for ( i = legalNums.length - 1; i > 0; i-- ) {
          var rand = getRandomInt( 0, i );
          var temp = legalNums[i];
          legalNums[i] = legalNums[rand];
          legalNums[rand] = temp;
        }
      }
      return legalNums;
    },
  };

  /**
	 * Get a random integer within a range
	 *
	 * @param {Number} min Minimum number
	 * @param {Number} max Maximum range
	 * @returns {Number} Random number within the range (Inclusive)
	 */
  function getRandomInt(min, max) {
    return Math.floor( Math.random() * ( max + 1 ) ) + min;
  }
  return {
    /**
		 * Get the singleton instance. Only one instance is allowed.
		 * The method will either create an instance or will return
		 * the already existing instance.
		 *
		 * @param {[type]} config [description]
		 * @returns {[type]} [description]
		 */
    getInstance: function( config ) {
      if ( !_instance ) {
        _instance = init( config );
      }
      return _instance;
    }
  };
} )( jQuery );
$(window).load(function() {
		// Animate loader off screen
		$(".se-pre-con").fadeOut("slow");
	});
$( document ).ready(function() {
  // attachFastClick.attach(document.body);
  var game = Sudoku.getInstance();
  $( "#container").append( game.getGameBoard() );
  $( "#showM").click( function() {
    game.showM();
  } );
  $( "#showSolution").click( function() {
    // game.showSolution();
    var message = JSON.stringify("La solution va s'afficher. Êtes-vous sûr de vouloir abandonner la partie ?");
    game.showModale(1, message, 1, 'showSolution');
    $('.modale').addClass('small');
  } );
  $( "#restartGrid").click( function() {
    var message = JSON.stringify('Vous êtes sur le point de réinitialiser la grille. Êtes-vous sûr de vouloir abandonner la partie ?');
    game.showModale(1, message, 1, 'restartGrid');
    $('.modale').addClass('small');
  } );
  $( "#help").click( function() {
    var helpText = "<p class='big'>Comment jouer</p>"

                + "<div class='accordion'>"
                + "<div class='demo-rules-specific demo-section'><a href=''>Pour démarrer</a></div>"
                + "<div class='foldable'>"
                + "<p>Vous devez commencer par choisir un niveau de jeu en cliquant sur NOUVELLE PARTIE. <span class='demo-levels e'></span> <span class='demo-levels m'></span> <span class='demo-levels h'></span></p>"
                + "<p>Pour remplir la grille, cliquez dans une case pour la sélectionner puis choisissez un chiffre (les chiffres se trouvent sous la grille).</p>"
                + "N'hésitez pas à vous servir de l'outil <span class='notes-color'>NOTES</span> (en-dessous des chiffres) qui vous permet de rajouter dans la grille des chiffres qui vous semblent probables."
                + "<div class='demo-notes wrap-center'>NOTES<span ></span></div>"
                + "</div>"
                + "<div class='demo-section'><a href=''>Différences entre les niveaux</a></div>"
                + "<div class='foldable'>"
                + "Le nombre de chiffres montrés au départ varie selon le niveau."
                + "<p>Le <span class='easy-color'>niveau facile</span> vous offre davantage d'aides visuelles: par exemple, si le chiffre rajouté se trouve déjà dans la colonne, la rangée ou la section, la case est colorée en rouge. Par ailleurs, un indice au-dessus des chiffres vous indique les chiffres restants à placer dans la grille.<span class='demo-figure f1'>1</span>.</p>"
                + "</div>"
                + "<div class='demo-rules-title demo-section'><a href=''>Rappel - Règles du Sudoku</a></div>"
                + "<div class='foldable demo-rules'>"
                + "<p>Le sudoku classique contient neuf lignes et neuf colonnes, donc 81 cases au total.</p>"
                + "<p>Le but du jeu est de remplir ces cases avec des chiffres allant de 1 à 9 en veillant toujours à ce qu'un même chiffre ne figure qu'une seule fois par colonne, une seule fois par ligne, et une seule fois par carré de neuf cases.</p>"
                + "<p>Au début du jeu, quelques chiffres sont déjà placés et il vous reste à trouver les autres. Pour trouver les chiffres manquants, tout est une question de logique et d'observation.</p>"
                + "</div>"
                + "</div>"
                + "<div class='close-layer'>Fermer la fenêtre</div>"

    var message = JSON.stringify(helpText);
    game.showModale(1, message, 0);
    var allPanels = $('.accordion  .foldable').hide();
    $('.close-layer').click(function(e){
      $(".modale").fadeOut(300);
      $('.dialog-overlay').fadeOut(500, function () {
          $(this).remove();
        });
    });
    $('.demo-section a').click(function() {
      console.log("test",$(this))
      if(!$(this).parent().hasClass("opened")) {
        allPanels.slideUp();
        $('.demo-section').removeClass('opened');
        $(this).parent().next().slideDown().prev().addClass('opened');

      } else {
        $(this).parent().next().slideUp().prev().removeClass('opened');
      }
       return false;
    });
  } );
  $( "#solve").click( function() {
    game.solve();
  } );
  $( "#validate").click( function() {
    game.validate();
  } );
  $( "#reset").click( function() {
    game.reset();
  } );

  $("#create-easy").click( function() {
    game.createSudoku(0);
    $('.level').removeClass("opened");
  } );
  $( "#create-medium").click( function() {
    game.createSudoku(1);
    $('.level').removeClass("opened");
  } );
  $( "#create-hard").click( function() {
    game.createSudoku(2);
    $('.level').removeClass("opened");
  } );
  $(".numbers").click( function(e) {
    var value = parseInt($(e.target).attr("id").slice(4));
    if(value === 0) {
      value = null;
    }
    game.selectNumber(value);
  } );
  $("#myonoffswitch").click(function(e) {
    $(this).is(":checked")? game.toggleNotes(1):game.toggleNotes(0);
  });
  $("#mode-flowers").click(function(e) {
    $('h1').text('Sudoku');
    $('body').removeClass("asia");
    $('body').removeClass("night");
    $('body').removeClass("cul");
    $('body').removeClass("sushi");
    $('body').removeClass("licorne");
    $('body').removeClass("cat");

    $('body').addClass("flowers");
  });
  $("#mode-asia").click(function(e) {
    $('h1').text('Sudoku');
    $('body').removeClass("flowers");
    $('body').removeClass("night");
    $('body').removeClass("cul");
    $('body').removeClass("sushi");
    $('body').removeClass("licorne");
    $('body').removeClass("cat");
    $('body').addClass("asia");
  });
  $("#mode-night").click(function(e) {
    $('h1').text('Sudoku');
    $('body').removeClass("flowers");
    $('body').removeClass("asia");
    $('body').removeClass("cul");
    $('body').removeClass("sushi");
    $('body').removeClass("licorne");
    $('body').removeClass("cat");
    $('body').addClass("night");
  });
  $("#mode-cul").click(function(e) {
    $('h1').text('SudoCul');
    $('body').removeClass("flowers");
    $('body').removeClass("asia");
    $('body').removeClass("night");
    $('body').removeClass("sushi");
    $('body').removeClass("licorne");
    $('body').removeClass("cat");
    $('body').addClass("cul");
  });
  $("#mode-cat").click(function(e) {
    $('h1').text('SudoCat');
    $('body').removeClass("flowers");
    $('body').removeClass("asia");
    $('body').removeClass("night");
    $('body').removeClass("cul");
    $('body').removeClass("licorne");
    $('body').removeClass("sushi");
    $('body').addClass("cat");
  });
  $("#mode-licorne").click(function(e) {
    $('h1').text('Sudocorne');
    $('body').removeClass("flowers");
    $('body').removeClass("asia");
    $('body').removeClass("night");
    $('body').removeClass("cul");
    $('body').removeClass("cat");
    $('body').removeClass("sushi");
    $('body').addClass("licorne");
  });
  $("#mode-sushi").click(function(e) {
    $('h1').text('Sushiku');
    $('body').removeClass("flowers");
    $('body').removeClass("asia");
    $('body').removeClass("night");
    $('body').removeClass("cul");
    $('body').removeClass("cat");
    $('body').removeClass("licorne");
    $('body').addClass("sushi");
  });

  $("#new-game").hover(function(e) {
    $('.level').addClass("opened");
  });
  document.querySelector('#new-game').addEventListener("touchstart", function(e) {
    $('.level').addClass("opened");
  }, false);
  $("#new-game").click(function(e) {
    // $('.level').removeClass('opened');
  });
  document.querySelector('#no-new-level').addEventListener("touchstart", function(e) {
    $('.level').removeClass("opened");
  }, false);
  $("#no-new-level").click(function(e) {
    console.log("click no-event")
    $('.level').removeClass('opened');
  });
  $(".levels-options").mouseleave(function(e) {
    //$('.level').removeClass('opened');
  });
  $(".options-game").mouseleave(function(e) {
    $('.level').removeClass('opened');
  });
  $('.demo-rules-title').click(function(e){
    $('.demo-rules').slideUp();
  });

});
