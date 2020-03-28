const { ipcRenderer } = require('electron');
const ioHook = require('iohook');


(function() {
    const scannerDetection = {
        input_stack: [],
        last_input_time: null,
        avg_time_input_threshold: 24,
        avg_input_time: this.avg_time_input_threshold,
        detecting_scanning: true,
        resetStack: function() {
            this.setInputStack([]);
        },
        resetAvgInputTime: function() {
            this.setAvgInputTime(this.avg_time_input_threshold);
        },
        setInputStack: function(value) {
            this.input_stack = value;
        },
        addToInputStack: function(value) {
            this.input_stack.push(value);
        },
        setLastInputTime: function(value) {
            this.last_input_time = value;
        },
        setAvgInputTime: function(value) {
            this.avg_input_time = value;
        },
        setDetectingScanning: function(value) {
            this.detecting_scanning = value;
        }
    };


    ioHook.on("keydown",(e)=>{
        scannerDetection.setLastInputTime(Date.now());
    })


    ioHook.on("keypress",(e)=>{
        //get key from keypress
        //check if numerical, stop event handler if not numerical
        if (e.keychar< 48 || e.keychar > 123) {
            return;
        }

        const key = String.fromCharCode(e.keychar)


        //get current time
        const currentInputTime = Date.now();

        //check and see if avg time between inputs breaks the input threshold
        const timeBetweenInputs = currentInputTime - scannerDetection.last_input_time;
        scannerDetection.setAvgInputTime((scannerDetection.avg_input_time + timeBetweenInputs) / 2);

        //if it is currently scanning or the average time passes the threshold test, continue
        if (
            scannerDetection.detecting_scanning ||
            scannerDetection.avg_input_time < scannerDetection.avg_time_input_threshold
        ) {
            //set mode to currently scanner and add the given key value to the stack
            scannerDetection.setDetectingScanning(true);
            scannerDetection.addToInputStack(key);

            //after a time, check if we have received any more input in a while
            // also, check if currently in scanning mode (prevents the settimeouts from overlapping eachother)
            setTimeout(function(){
                if (
                    scannerDetection.detecting_scanning &&
                    scannerDetection.last_input_time - Date.now() < scannerDetection.avg_time_input_threshold
                ){
                    //shut down scanner detection mode
                    scannerDetection.setDetectingScanning(false);

                    //check if input stack is greater than 5
                    // TODO decide if this should belong to prevent quick number via
                    //keyboard/pad input
                    if (scannerDetection.input_stack.length >= 5) {
                        const barcode = scannerDetection.input_stack.join("");
                        JsBarcode("#barcode", barcode);
                        ipcRenderer.send('print', barcode);
                    }

                    //reset scanner-detection-state-dependent constiables
                    scannerDetection.resetStack();
                    scannerDetection.resetAvgInputTime();
                }
            }, 150);
        } else {
            //rest the avg input time and pass the keypress into the first element of the input stack
            scannerDetection.resetAvgInputTime();
            scannerDetection.setInputStack([key]);
        }
    })

    ioHook.start()
})();
