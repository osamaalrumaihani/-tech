/* Mujtamae visitor intake — public client connector (no elevated keys). */
(function () {
  const endpoint = 'https://mapzpiyadkygkarvxgfw.supabase.co/functions/v1/mujtamae-visitor-api';
  const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcHpwaXlhZGt5Z2thcnZ4Z2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NjU4NDMsImV4cCI6MjEwNzE0MTg0M30.6cQfR1n5uArHLdOrDYdaE-wiy3I3z0Fxs9d4T8EcKA0';
  let saved = null, token = null, status = '', feedbackStatus = '', pending = false;
  const request = async (data) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 14000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'content-type':'application/json','apikey':anon,'authorization':'Bearer '+anon},
        body: JSON.stringify(data), signal: controller.signal
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error || 'save_failed');
      return body;
    } finally {clearTimeout(timeout);}
  };
  const originalShowResult = showResult;
  showResult = function () {
    originalShowResult();
    const main = document.querySelector('.view.result');
    if (!main) return;
    const note = document.createElement('div');
    note.className = 'privacy';
    note.setAttribute('role','status');
    note.textContent = status==='saving'?'جارٍ حفظ طلبك بأمان...':status==='saved'?'✓ تم حفظ الطلب والإجابات ونتيجة التوجيه في قاعدة بيانات مجتمعي.':status==='failed'?'تعذر الحفظ. لم يتم تسجيل طلبك؛ يمكنك إعادة المحاولة.':'لم يتم حفظ الطلب بعد.';
    main.querySelector('.form-row')?.before(note);
    if(status==='failed'){
      const retry=document.createElement('button');
      retry.type='button'; retry.className='btn btn-soft';
      retry.textContent='إعادة محاولة الحفظ';
      retry.onclick=save;
      note.after(retry);
    }
    const service=document.getElementById('serviceMsg'),rating=document.getElementById('rateMsg');
    if (service && state.serviceDelivered) service.textContent=feedbackStatus==='saved'?'تم حفظ التقييم بنجاح.':feedbackStatus==='saving'?'جارٍ حفظ التقييم...':feedbackStatus==='failed'?'تعذر حفظ التقييم.':'تم اختيار الإجابة.';
    if (rating && state.feedback) rating.textContent=feedbackStatus==='saved'?'شكرًا لك، حُفظ تقييمك.':feedbackStatus==='saving'?'جارٍ حفظ التقييم...':feedbackStatus==='failed'?'تعذر حفظ التقييم.':'تم اختيار التقييم.';
  };
  async function save() {
    if(pending)return;
    pending=true;status='saving';showResult();
    try{
      const response=await request({action:'submit',profile:state.profile,answers:state.answers,consent:true,website:''});
      saved=response.visitorId;token=response.feedbackToken;status='saved';
    }catch(error){
      console.warn('Mujtamae saving failed', error);status='failed';
    }finally{pending=false;showResult();}
  }
  async function feedback(){
    if(!saved||!token){feedbackStatus='failed';showResult();return;}
    feedbackStatus='saving';showResult();
    try{await request({action:'feedback',visitorId:saved,feedbackToken:token,serviceDelivered:state.serviceDelivered||null,satisfaction:state.feedback||null});feedbackStatus='saved';}
    catch(error){console.warn('Feedback saving failed',error);feedbackStatus='failed';}
    showResult();
  }
  document.addEventListener('click', (event)=>{
    const btn=event.target.closest('button[data-action],button[data-rate],button[data-service]');
    if(!btn)return;
    if(btn.dataset.action==='result') setTimeout(save,20);
    if(btn.dataset.rate||btn.dataset.service) setTimeout(feedback,20);
    if(['reset','home'].includes(btn.dataset.action)){saved=null;token=null;status='';feedbackStatus='';}
  },true);
  document.getElementById('restartTop')?.addEventListener('click',()=>{saved=null;token=null;status='';feedbackStatus='';});
  document.getElementById('brandHome')?.addEventListener('click',()=>{saved=null;token=null;status='';feedbackStatus='';});
})();