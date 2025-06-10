// const asynchandler=(fn)=> 
//  async (req,res,next)=>{
//   try {
//     await fn(req,res,next)
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message
//     })
//   }
// }// higher order function using try catch

//using Promises
const asynchandler=(requestHandler)=>{
  (req,res,next)=>{
    Promise.resolve(requestHandler(req,res,next))
    .catch((err)=>next(err))
  }
}
export {asynchandler}