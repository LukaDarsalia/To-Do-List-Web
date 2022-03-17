
        for (let k = 0; k <$(".checkboxes").length; k++){
            let m = k+1;
            $(".checkboxes")[k].id = "0"+m;
            let labels = $(".labels")[k];
            let labelId = "lable0"+m;
            labels.id = labelId;
            $('#'+labelId).attr("for","0"+m);


    }


    function listAction() {
        let input = $("#inputList").val();
        location.href = input;
    }


        let array = [];
        let arrayNames = [];
        let i = 0;

        function buttonChanger(){
            i = document.getElementsByName("checkbox");
            let checkedCounter = 0;
            array = $.map(i, function(value, index) {
                return [value];
            });
            for (let j = 0; j<array.length; j++){
                if (array[j].checked){
                    checkedCounter++;
                    $("#add").css("display", "none");
                    $("#remover").css("display", "inline-block");
                    $("#remover").css("top", "3px");
                    $("#butRem").css("line-height", "50px");
                    $("#formOne").css("margin-bottom", "-67px");
                    document.getElementById("input").readOnly = true;
                    document.getElementById("input").placeholder = "";
                    j = array.length;
                }
            }
            if (checkedCounter === 0){
                document.getElementById("input").readOnly = false;
                document.getElementById("input").placeholder = "New Item";
                $("#remover").css("display", "none");
                $("#formOne").css("margin-bottom", "0px");
                $("#add").css("display", "inline-block");
            }
        };