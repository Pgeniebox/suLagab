<LinearLayout
	xmlns:android="http://schemas.android.com/apk/res/android"
	xmlns:app="http://schemas.android.com/apk/res-auto"
	xmlns:tools="http://schemas.android.com/tools"
	android:layout_width="match_parent"
	android:layout_height="match_parent"
	android:orientation="vertical">
	<FrameLayout
		android:id="@+id/roott"
		android:layout_width="match_parent"
		android:layout_height="match_parent"
		android:background="#000000"
		android:orientation="vertical">
		<WebView
			android:id="@+id/webView"
			android:layout_width="match_parent"
			android:layout_height="match_parent" />
	</FrameLayout>
	<EditText
		android:id="@+id/errorText"
		android:layout_width="match_parent"
		android:layout_height="0dp"
		android:padding="8dp"
		android:textSize="12sp"
		android:textColor="#000000"
		android:hint="Edit Text"
		android:textColorHint="#607D8B" />
</LinearLayout>

	
