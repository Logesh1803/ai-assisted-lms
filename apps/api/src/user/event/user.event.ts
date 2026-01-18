import {UserTokenData} from "@/user/interfaces/user.interfaces";

export class UserEvent {
  constructor(public userTokenData:UserTokenData) {
    console.log("PasswordRestEventTriggered")
  }
}

