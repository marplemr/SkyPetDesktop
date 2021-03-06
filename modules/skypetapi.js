const eth=require('skypetwrapper');
const getEthereumStart=eth.getEthereumStart;
const addAttribute=eth.addAttribute;
const getAttributes=eth.getAttributes;
const closeGeth=eth.closeGeth;
const checkAccount=eth.checkAccount;
const createAccount=eth.createAccount;
const getAccounts=eth.getAccounts;
const checkPassword=eth.checkPassword;
const getContract=eth.getContract;
const watchContract=eth.watchContract;
const getCost=eth.getCost;
const getMoneyInAccount=eth.getMoneyInAccount;
const getSync=eth.getSync;

const returnSuccessError=(event, err, result)=>{
    return err?event.sender.send("passwordError", err.toString()):event.sender.send("successLogin", result);
}
function SkyPetApi(event, globalevent, gethBinary){
    let geth;
    let contract;
    let account;
    getEthereumStart(gethBinary, (gethInstance)=>{
        geth=gethInstance;
        getSync((progress)=>{
            globalevent.send("sync", {currentProgress:progress, isSyncing:true});
        }, ()=>{
            syncHelper(globalevent);
        })
    });
    const syncHelper=(event)=>{
        contract=getContract(); 
        getAccounts((err, acc)=>{
            if(!err){
                account=acc;
                getMoneyInAccount(acc, (err, balance)=>{
                    event.send("moneyInAccount", balance);
                })
                event.send("account", acc);
            }
        })
        event.send("sync", {currentProgress:100, isSyncing:false});
        getCost(contract, (err, result)=>{
            err?"":event.send("cost", result);
        })
    }
    this.close=()=>{
        if(geth){
            closeGeth(geth);
        }
    }
    event.on('password', (event, arg)=>{
        getAccounts((err, result)=>{
            return err?createAccount(arg, (err, result)=>{
                account=result;
                returnSuccessError(event, err, result);
                event.sender.send("account", result);
            }):checkPassword(arg, (err, result)=>{
                returnSuccessError(event, err, result);
            });
        });
    })
    event.on('addAttribute', (event, arg) => {
        contract?addAttribute(account, arg.password,arg.message, arg.hashId, contract, (err, result)=>{
            err?event.sender.send("passwordError", err.toString()):event.sender.send("attributeAdded", true);
        }):"";
    });
    event.on('id', (event, hashId)=>{
        contract?getAttributes(contract, hashId,  (err, attributes)=>{
            err?"":event.sender.send("retrievedData", attributes);
        }):"";
        contract?watchContract(account, contract, hashId,  (err, attributes)=>{
            err?"":event.sender.send("retrievedData", attributes);
        }, (err, balance)=>{
            err?"":event.sender.send("moneyInAccount", balance);
        }):"";
    });
    event.on('getAttributes', (event, hashId) => {
        contract?getAttributes(contract, hashId, (err, result)=>{
            err?"":event.sender.send("retrievedData", result);
        }):"";
    });
}
exports.SkyPetApi=SkyPetApi;