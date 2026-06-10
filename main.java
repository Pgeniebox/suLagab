package com.my.newproject19;

import android.animation.*;
import android.app.*;
import android.app.Activity;
import android.app.DialogFragment;
import android.app.Fragment;
import android.app.FragmentManager;
import android.content.*;
import android.content.res.*;
import android.graphics.*;
import android.graphics.drawable.*;
import android.media.*;
import android.net.*;
import android.os.*;
import android.text.*;
import android.text.style.*;
import android.util.*;
import android.view.*;
import android.view.View.*;
import android.view.animation.*;
import android.webkit.*;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.*;
import android.widget.EditText;
import java.io.*;
import java.text.*;
import java.util.*;
import java.util.regex.*;
import org.json.*;
import android.view.WindowManager;
import java.io.InputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;


public class MainActivity extends Activity {
	
	private WebChromeClient.CustomViewCallback customViewCallback;
	private View customView;
	private boolean inj = false;
	private String script = "";
	
	private FrameLayout roott;
	private EditText errorText;
	private WebView webView;
	
	private RequestNetwork req;
	private RequestNetwork.RequestListener _req_request_listener;
	
	@Override
	protected void onCreate(Bundle _savedInstanceState) {
		super.onCreate(_savedInstanceState);
		setContentView(R.layout.main);
		initialize(_savedInstanceState);
		initializeLogic();
	}
	
	private void initialize(Bundle _savedInstanceState) {
		roott = findViewById(R.id.roott);
		errorText = findViewById(R.id.errorText);
		webView = findViewById(R.id.webView);
		webView.getSettings().setJavaScriptEnabled(true);
		webView.getSettings().setSupportZoom(true);
		req = new RequestNetwork(this);
		
		webView.setWebViewClient(new WebViewClient() {
			@Override
			public void onPageStarted(WebView _param1, String _param2, Bitmap _param3) {
				final String _url = _param2;
				webView.setVisibility(View.INVISIBLE);
				super.onPageStarted(_param1, _param2, _param3);
			}
			
			@Override
			public void onPageFinished(WebView _param1, String _param2) {
				final String _url = _param2;
				webView.setVisibility(View.VISIBLE);
				super.onPageFinished(_param1, _param2);
			}
		});
		
		_req_request_listener = new RequestNetwork.RequestListener() {
			@Override
			public void onResponse(String _param1, String _param2, HashMap<String, Object> _param3) {
				final String _tag = _param1;
				final String _response = _param2;
				final HashMap<String, Object> _responseHeaders = _param3;
				script = _response;
				webView.loadUrl("https://www.ysscores.com/fr/index");
			}
			
			@Override
			public void onErrorResponse(String _param1, String _param2) {
				final String _tag = _param1;
				final String _message = _param2;
				
			}
		};
	}
	
	private void initializeLogic() {
		inj = false;
		req.startRequestNetwork(RequestNetworkController.GET, "https://raw.githubusercontent.com/Pgeniebox/suLagab/refs/heads/main/script.js", "script", _req_request_listener);
		getWindow().setFlags(
		        WindowManager.LayoutParams.FLAG_FULLSCREEN,
		        WindowManager.LayoutParams.FLAG_FULLSCREEN);
		WebSettings settings = webView.getSettings();
		
		        settings.setJavaScriptEnabled(true);
		        settings.setDomStorageEnabled(true);
		        settings.setDatabaseEnabled(true);
		        settings.setAllowFileAccess(true);
		        
		        settings.setUseWideViewPort(true);
		        settings.setLoadWithOverviewMode(true);
		        settings.setMediaPlaybackRequiresUserGesture(false);
		
		webView.addJavascriptInterface(new JsBridge(this), "Android");
		        
		webView.setWebChromeClient(new WebChromeClient() {
			@Override
			    public boolean onConsoleMessage(ConsoleMessage cm) {
				     /*   String msg = cm.message() + " -- line " + cm.lineNumber();
        errorText.setText(errorText.getText().toString()+" "+msg); */
				        return true;
				    }
			          @Override
			    public void onProgressChanged(WebView view, int newProgress) {
				       if (newProgress <30) {inj=false;}
				else if (newProgress >30&&!inj) {
					       inj=true;
					        view.evaluateJavascript( script,null);
					        } 
				            
				        
				    }
			            @Override
			            public Bitmap getDefaultVideoPoster() {
				                Bitmap bitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
				                bitmap.eraseColor(Color.TRANSPARENT);
				                return bitmap;
				            }
			
			            // Fullscreen video
			            @Override
			            public void onShowCustomView(View view, CustomViewCallback callback) {
				
				                if (customView != null) {
					                    callback.onCustomViewHidden();
					                    return;
					                }
				
				                customView = view;
				                customViewCallback = callback;
				
				                webView.setVisibility(View.GONE);
				                roott.addView(customView,
				                        new FrameLayout.LayoutParams(
				                                FrameLayout.LayoutParams.MATCH_PARENT,
				                                FrameLayout.LayoutParams.MATCH_PARENT));
				            }
			
			            @Override
			            public void onHideCustomView() {
				
				                if (customView == null)
				                    return;
				
				                roott.removeView(customView);
				                customView = null;
				                webView.setVisibility(View.VISIBLE);
				                customViewCallback.onCustomViewHidden();
				            }
			        });
		        
		
		String ua = "Mozilla/5.0 (SMART-TV; Linux; Tizen 2.4.0) " +
		            "AppleWebKit/537.36 (KHTML, like Gecko) " +
		            "Safari/537.36";
		
		
		settings.setUserAgentString(ua);
	}
	
	@Override
	public void onBackPressed() {
		if (customView != null) {
			            ((WebChromeClient) webView.getWebChromeClient()).onHideCustomView();
			        } else if (webView.canGoBack()) {
			            //webView.goBack();
			        } else {
			            super.onBackPressed();
			        }
	}
	

	public void _extra() {
	}
	public class JsBridge {
		    private final Activity activity;
		    private Dialog youtubeDialog;
		
		    public JsBridge(Activity activity) {
			        this.activity = activity;
			    }
		
		    @JavascriptInterface
		    public void openYouTubeTv(final String videoId) {
			        activity.runOnUiThread(() -> {
				            showYoutubeDialog(videoId);
				        });
			    }
		
		    private void showYoutubeDialog(String videoId) {
			        if (youtubeDialog != null && youtubeDialog.isShowing()) {
				            youtubeDialog.dismiss();
				        }
			
			        youtubeDialog = new Dialog(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
			
			        WebView webView = new WebView(activity);
			        WebSettings s = webView.getSettings();
			        s.setJavaScriptEnabled(true);
			        s.setDomStorageEnabled(true);
			        s.setMediaPlaybackRequiresUserGesture(false);
			String uaa = "Mozilla/5.0 (SMART-TV; Linux; Tizen 2.4.0) " +
			            "AppleWebKit/537.36 (KHTML, like Gecko) " +
			            "Safari/537.36";
			            s.setUserAgentString(uaa);
			        webView.setWebChromeClient(new WebChromeClient());
			        webView.setWebChromeClient(new WebChromeClient() {
				
				         
				            @Override
				            public Bitmap getDefaultVideoPoster() {
					                Bitmap bitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
					                bitmap.eraseColor(Color.TRANSPARENT);
					                return bitmap;
					            }
				
				            // Fullscreen video
				            @Override
				            public void onShowCustomView(View view, CustomViewCallback callback) {
					
					                if (customView != null) {
						                    callback.onCustomViewHidden();
						                    return;
						                }
					
					                customView = view;
					                customViewCallback = callback;
					
					                webView.setVisibility(View.GONE);
					                roott.addView(customView,
					                        new FrameLayout.LayoutParams(
					                                FrameLayout.LayoutParams.MATCH_PARENT,
					                                FrameLayout.LayoutParams.MATCH_PARENT));
					            }
				
				            @Override
				            public void onHideCustomView() {
					
					                if (customView == null)
					                    return;
					
					                roott.removeView(customView);
					                customView = null;
					                webView.setVisibility(View.VISIBLE);
					                customViewCallback.onCustomViewHidden();
					            }
				        });
			        webView.setWebViewClient(new WebViewClient());
			
			        webView.loadUrl("https://www.youtube.com/tv#/watch?v="+videoId);
			
			        youtubeDialog.setContentView(webView);
			        youtubeDialog.setCancelable(true);
			        youtubeDialog.setOnKeyListener((dialog, keyCode, event) -> {
				            if (keyCode == KeyEvent.KEYCODE_BACK && event.getAction() == KeyEvent.ACTION_UP) {
					                youtubeDialog.dismiss();
					                return true;
					            }
				            return false;
				        });
			
			        youtubeDialog.show();
			    }
		
	}
	
	
	@Deprecated
	public void showMessage(String _s) {
		Toast.makeText(getApplicationContext(), _s, Toast.LENGTH_SHORT).show();
	}
	
	@Deprecated
	public int getLocationX(View _v) {
		int _location[] = new int[2];
		_v.getLocationInWindow(_location);
		return _location[0];
	}
	
	@Deprecated
	public int getLocationY(View _v) {
		int _location[] = new int[2];
		_v.getLocationInWindow(_location);
		return _location[1];
	}
	
	@Deprecated
	public int getRandom(int _min, int _max) {
		Random random = new Random();
		return random.nextInt(_max - _min + 1) + _min;
	}
	
	@Deprecated
	public ArrayList<Double> getCheckedItemPositionsToArray(ListView _list) {
		ArrayList<Double> _result = new ArrayList<Double>();
		SparseBooleanArray _arr = _list.getCheckedItemPositions();
		for (int _iIdx = 0; _iIdx < _arr.size(); _iIdx++) {
			if (_arr.valueAt(_iIdx))
			_result.add((double)_arr.keyAt(_iIdx));
		}
		return _result;
	}
	
	@Deprecated
	public float getDip(int _input) {
		return TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, _input, getResources().getDisplayMetrics());
	}
	
	@Deprecated
	public int getDisplayWidthPixels() {
		return getResources().getDisplayMetrics().widthPixels;
	}
	
	@Deprecated
	public int getDisplayHeightPixels() {
		return getResources().getDisplayMetrics().heightPixels;
	}
}
