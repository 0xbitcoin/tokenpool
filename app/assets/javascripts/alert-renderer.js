export default class AlertRenderer {



     renderError(message)
    {
      this.alertMessage = message;
    }

     renderHelp(message)
    {
       this.alertMessage = message;
    }


    getAlertMessage()
    {
      return this.alertMessage;
    }

}
